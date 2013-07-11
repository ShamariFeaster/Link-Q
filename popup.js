/*
 * 7/9/13 - 
 * ISSUES: 
 *    blundleCreate:
 *      1. need to save state when switching away and reinstate when coming back
 * */

var _bg = null;
var _subfolderText = '';
window.categories = Array();
var _enumUi = {linkStaging:1, blundleCreate:2, blundleSelect:3 ,blundleMounted:4};
function init(){

$(function(){
  _bg = chrome.extension.getBackgroundPage();  
  if(_bg.window.rootTree == null)
    _bg.createBookmarkTreeSelect();
  var content = "";
  var linkText = "";
  var url = "";
  var pinned = "";
  switch(_bg.getUiState()){
    case _enumUi.linkStaging:
      setupLinkStaging();
      break;
    case _enumUi.blundleSelect:
      setupSelectBlundle();
      break;
    case _enumUi.blundleCreate:
      setupNewBlundle();
      break;
    case _enumUi.blundleMounted:
      break;
    }
  
    function setupLinkStaging(){
      _bg.setUiState(_enumUi.linkStaging);
      content = '';
      if(_bg._pages.length > 0){

        for(var i = 0; i < _bg._pages.length; i++){
            /*if link has no text then e put the website name in queue
             * note: this doesn't work with pictures that do have text between
             * a tags that is html. Need work around
            */
            if(_bg._pages[i].text.length == 0) {
              url = _bg._pages[i].url.replace(/(http:\/\/|https:\/\/)/, "");
              linkText = url.substr(0, url.indexOf('/'));
            } else {
              linkText = _bg._pages[i].text;
              }
            pinned = (_bg._pages[i].pinned) ? 'pinned' : "";
            content += '<tr><td><button class="link" id="' + _bg._pages[i].url + '">' + linkText + '</button></td> \
            <td><button data-index="'+i+'" class="pin '+pinned+'" id="' + _bg._pages[i].url + '_pin">Pin</button></td> \
            <td><td><div class="rename" id="' + _bg._pages[i].url + '"><button id="rename_button">Rename Mark</button></div></td></td>\
        <td><div class="subfolder_div">' + _bg._subFolders + '</div></td></tr>';
          }
        $('#linqs').html(content);
      } else  {  
        $('#linqs').text('No Links In Queue');
      }
      //display root folder select
      $('#root_folder').html('\
                <tr>\
                    <td>'+_bg._folders+'</td>\
                    <td><button id="empty_queue">Clear Queue</button></td>\
                </tr> \
                <tr>\
                    <td><button id="save_pinned">Save Pinned</button></td> \
                    <td><button id="create_new_bundle">New Bundle</button></td>\
                    <td><button id="load_bundle">Load Bundle</button></td>\
                    </tr>'
        );  
      
      //reinstating saved root folder state
      if(_bg._popupRootfolderState != ''){
        $('#folder_select').val(_bg._popupRootfolderState); //#folder_select is in _bg_folders html
      }
      
      $('#create_new_bundle').click(function(e){
        saveLinkStageState();
        setupNewBlundle();
      });
      
      $('#load_bundle').click(function(e){
        saveLinkStageState();
        setupSelectBlundle(); 
      });
    }
    
    function setupSelectBlundle(){
      _bg.setUiState(_enumUi.blundleSelect);
        var option = {text: ''};
        _bg.getBlundlesFromTree(_bg.window.rootTree, option);
        _bg._blundles = '<select id="blundles_select">';
        _bg._blundles += option.text;
        _bg._blundles += '</select>';
        
        $('#linqs').hide();
        $('#root_folder').hide();
        var loadBundleHtml = '<tr id="available_blundles">\
                                <td>' + _bg._blundles + '</td> \
                                <td><button id="mount_blundle">Load Blundle</button></td> \
                             </tr>\
                             <tr>\
                                <td><button id="back_to_linqs2">Back</button></td>\
                             </tr>';
        $('#load_bundle_gui').html(loadBundleHtml); 
        //reinstating previous blundle selected state
        if(_bg._popupBlundleSelectedState != ''){
          $('#blundles_select').val(_bg._popupBlundleSelectedState); 
        }
        $('#load_bundle_gui').show();
        
        $('#back_to_linqs2').unbind(); //prevents multiple bindings
        
        //switches back to bundle edit mode
        $('#back_to_linqs2').click(function(e){
            _bg.log('going back to link staging from blundle loading');
            setupLinkStaging();
            _bg.log('Going back to link staging'); 
            $('#load_bundle_gui').hide();
            $('#linqs').show();
            $('#root_folder').show();
            reinstateLinkSubfolders();
          });
          
        //creates blundle category select
        $('#mount_blundle').click(function(e){
            _bg.log('Blundle Lodddad Clicked'); 
            _bg.setUiState(_enumUi.blundleMounted);
            _bg.emptyLoadedBlundleArray();
            var option = {text: ''};
            //_bg.log($('#blundles_select option:selected').val());
            _bg.traverseTree(_bg.window.rootTree, -1000, option, $('#blundles_select option:selected').val());
            if(option.text == ''){
              _bg._blundleCategories = '';
            }else{
              _bg._blundleCategories = '<select id="blundle_categories">';
              _bg._blundleCategories += option.text;
              _bg._blundleCategories += '</select>';
            }
            
            $('#load_bundle_gui').hide(); //hide loading gui
            $('#loaded_blundle_categories').html(_bg._blundleCategories);
            //reinstating previous category state
            if(_bg._popupMountedBlundleCategoryState != ''){
              $('#blundle_categories').val(_bg._popupMountedBlundleCategoryState); 
            }
            //populating blundle queue
            $('#blundle_categories option').each(function(index, category){
              _bg.traverseTreeV3(_bg.window.rootTree, _bg._loadedBlundleQueue, $(category).val(), false);
              });
            var links = filterLinksInQueue(_bg._loadedBlundleQueue, $('#blundle_categories option:selected').val());
            $('#loaded_blundle_linqs').html(links);
            $('#loaded_blundle_menu').html('<button id="back_to_">Back</button>');
            $('#loaded_blundle_gui').show();

            $('button.blundleLink').click(function(e){
               var url = $(this).data('url');
               _bg.log('blundleLink clicked' );
               _bg.openLinkFromBlundle(url);
              });
            
          }); 
      }
    
    function setupNewBlundle(){
      _bg.setUiState(_enumUi.blundleCreate);
      $('#linqs').hide();
      $('#root_folder').hide();
        var newBundleHtml = '<tr id="new_subfolders_input">\
                                <td>Bundle: </td><td><input id="new_bundle_name" type="text" size="20"></textarea></td> \
                                <td><button id="add_subfolder">Add Category</button></td> \
                                <td><button id="save_bundle">Save This Bundle</button></td>\
                             </tr>\
                             <tr>\
                                <td><button id="back_to_linqs">Back</button></td>\
                             </tr>';
        $('#new_bundle_gui').html(newBundleHtml); //maybe not working because id's aren't visible, 
        $('#new_bundle_gui').show();

         $('#add_subfolder').unbind(); //prevent mutiple action due to duplicate handlers
         $('#back_to_linqs').unbind();
         $('.category_row').unbind();
         
        //handlers for adding and removing subfolder rows 
        $('#add_subfolder').click(function(e){
          $('#new_subfolders_input').after('\
          <tr class="category_row">\
            <td>Category: </td><td><input class="subfolder_name" type="text" size="20"></textarea></td>\
            <td><button id="remove_category">Remove Category</button></td>\
          </tr>');
          
          $('.category_row').click(function(e){ //remove subfolder
            if(e.target.nodeName == 'BUTTON')
              $(this).remove();
          });
        });
      
        $('#save_bundle').click(function(e){
          $('.category_row').each(function(index, row){
              $row = $(row);
              //window.categoies holds names of this bundle's subfolders
              window.categories.push({name: $row.find('.subfolder_name').val()}); 
            });
            
            //create root in 'other bookmarks' (for now)
            chrome.bookmarks.create({title: $('input#new_bundle_name').val()}, function(blundle){
              if(typeof blundle.id != 'undefined') {
                //create category folder underneth root
                for(var i = 0; i < window.categories.length; i++){
                  chrome.bookmarks.create({parentId: blundle.id, title: window.categories[i].name});
                  }
                //create .blundle file
                var blundleInfo = "http://blundle.com?created=" + new Date().getTime();
                chrome.bookmarks.create({parentId: blundle.id, title: '.blundle', url: blundleInfo});
              }
                
            
            });
            //get root id
            //for each index in categories array, create subfolder under root
          
          });
    
        //switches back to bundle edit mode
        $('#back_to_linqs').click(function(e){
            _bg.log('Going back to link staging from blundle create'); 
            setupLinkStaging();
            $('#new_bundle_gui').hide();
            $('#new_subfolders_input').remove();
            $('#root_folder').show();
            $('#linqs').show();
            reinstateLinkSubfolders();
          });
      }
    
    /* returns DOM with filtered links as buttons
     * */
    function filterLinksInQueue(/*Array*/queue, /*int*/categoryId){
        var buttons = '';
        //_bg.log('hello');
        for(var i = 0; i < queue.length; i++){
          _bg.log(queue[i].parentId + categoryId);
          if(!queue[i].url == '' && queue[i].parentId == categoryId){ //only links, no folders
            buttons += '<button class="blundleLink" data-url="' + queue[i].url + '">' + queue[i].title + '</button>';
          }
        }
        return buttons;
      }
    
    
      
    
    
    
    
    //reinstating subfolder state
    function reinstateLinkSubfolders(){
      if(_bg.getUiState() == _enumUi.linkStaging){ //<--This test is most linkely unecessary
        _bg.log('reinstating links');
        $('#linqs tr').each(function(index, link){
            var url = $(link).find('.link').attr('id');
            var queueObj = _bg.getFromQueue(url);
            if(queueObj.subfolder != ''){
              $(link).find('#subfolder_select').val(queueObj.subfolder);
            }
            
          });
      }
    }
    
    reinstateLinkSubfolders();
    
    //open link from staging area
    $('button.link').click(function(e){
      var id = $(this).attr('id');
      _bg._lastUrl = _bg._currentUrl;
      _bg.openLink( _bg.getFromQueue(id) , true);
      if(_bg._lastUrl != _bg._currentUrl && _bg._tabOpen){
        _bg.removeFromQueue(_bg._lastUrl);
        }
      });
      
    //this was put in div, so I can get/set button text by getting the html of div
    /* 7/3/13 BUG: renaming makes it crash for some reason. NOT RESOLVED
     * 
     * */
	$('div.rename').click(function(e){
        var url = $(this).attr('id');
		var $parent = $(this);
		$parent.html('<input id="rename_text" type="text" size="20"></textarea>');
		$parent.find('#rename_text').focus();
		var queueObj = _bg.getFromQueue(url);
		
		$parent.focusout(function(){
			queueObj.text = $parent.find('#rename_text').val();
			$('#linqs tr').each(function(index, link){ //<------dupliclate code
				var thisUrl = $(link).find('.link').attr('id');
				if(thisUrl == url)
					$(link).find('.link').text(queueObj.text);
			});
			$parent.html('<button id="rename_button">Rename Mark</button>');
			
		});
    
		$('div.rename').keydown(function(e){
			if ( e.keyCode == 13 ) {
				var url = $(this).attr('id');
				var $parent = $(this);
				var queueObj = _bg.getFromQueue(url);
				queueObj.text = $parent.find('#rename_text').val();//update queue object
				$('#linqs tr').each(function(index, link){//cycle through queue gui and update button text
					var thisUrl = $(link).find('.link').attr('id');
					if(thisUrl == url)
						$(link).find('.link').text(queueObj.text);
				});
				$parent.html('<button id="rename_button">Rename Mark</button>');//replace textarea with button after done
			}

		});
	});
    //pins mark
    $('button.pin').click(function(e){
        var url = $(this).attr('id');
        url =  url.replace('_pin', '');
        if(_bg.togglePin(url) == true) {
          $(this).toggleClass('pinned', true);
        } else{
          $(this).toggleClass('pinned', false);
        }
      });
    //clears queue
	$('button#empty_queue').click(function(e){
		_bg.emptyQueue();
		$('#linqs tr').each(function(index, link){//remove buttons from popup
			$(link).remove();
		});
	});	
  //saves pinned links to bundle
  /* 7/3/13 BUG: only putting first pinned item in category. NOT RESOLVED
   * Suspecting: text or url may be empty
   * Try: printing out mark properties beofre saving and tracing loop
   * */  
	$('button#save_pinned').click(function(e){
		var mark = null;
		var queue = _bg._pages;
		for(var i = 0; i <= queue.length; i++){
			mark = queue[i];
			if(mark.pinned == true){
				chrome.bookmarks.create({parentId: mark.subfolder, title: mark.text, url: mark.url }, function(node){
					if(typeof node.id != 'undefined')
						_bg.log('Bookmark was made');
				
				});
			}
		}
	});	
  
	//updates subfolder property of mark when new sub selected
	$('#linqs').change(function(){
		var selectedValue = $(this).find('option:selected').val();
		if(typeof selectedValue != 'undefined') {
			_bg.log('subfolder was changed: ' + $(this).html());
			var url = $(this).find('.link').attr('id');
			var queueObj = _bg.getFromQueue(url);
			queueObj.subfolder = selectedValue;
			_bg.log('\nId of selected subfolder: '+ queueObj.subfolder);
		}
	});
  
  //loaded_blundle_categories change handler
  $('#loaded_blundle_categories').change(function(){
      var links = filterLinksInQueue(_bg._loadedBlundleQueue, $('#blundle_categories option:selected').val());
      $('#loaded_blundle_linqs').html(links);
	});
  
  function updateRootAndSubs(newRoot){
    _bg._rootFolderId = newRoot;
    _bg._popupRootfolderState = newRoot;
		var _subfolderText = '';
    //create subfolder select
    var option = {text:''};
    _bg.traverseTree(_bg.window.rootTree,-1000,option,_bg._rootFolderId);
		//if there are subfolders
    if(option.text != ''){
      _subfolderText = '<select id="subfolder_select"> \
              <option value="' + _bg._rootFolderId + '">Root</option>';
      _subfolderText += option.text;
      _subfolderText += '</select>';
      _bg._subFolders = _subfolderText;
    }
		  //if there aren't subfolders
		else{
			_bg._subFolders = '';
		}
		/*when a new root is chosen each mark get's it's parent folder, which
		is stupidly a property called 'subfolder', updated to the newly selected
		root*/
		$('#linqs tr').each(function(index, link){
				var url = $(link).find('.link').attr('id');
				var queueObj = _bg.getFromQueue(url);
				queueObj.subfolder = _bg._rootFolderId;
				//_bg.log('root for ' + $(link).find('.link').text() + ' is ' + queueObj.subfolder);
		});
    
    //so every link row gets a select, selector is class not id
    $('.subfolder_div').html(_bg._subFolders);
  }

    //updates possible subs when new root is selected
    $('#root_folder').change(function(){
        updateRootAndSubs($('#root_folder option:selected').val())
        var isBlundle = _bg.isThisBlundle(_bg.window.rootTree, $('#root_folder option:selected').val());
        if(isBlundle == true)
          _bg.log($('#root_folder option:selected').text() + ' is a blundle');
        else
          _bg.log($('#root_folder option:selected').text() + ' is not a blundle');
        });

  function saveLinkStageState(){
      $('#linqs tr').each(function(index, link){
        var url = $(link).find('.link').attr('id');
        var subfolder = $(link).find('#subfolder_select').val();
        _bg.log('saving link index ' + index + ' as ' + subfolder);
        var queueObj = _bg.getFromQueue(url);
        queueObj.subfolder = subfolder;
        });
    }

	//when popup is closed, cleanup stuff
    $(window).bind("unload", function() { 
      _bg.log('unloading');
      saveLinkStageState();
        
       switch(_bg.getUiState()){
        case _enumUi.linkStaging:
          _bg._popupRootfolderState = $('#folder_select option:selected').val();
          break;//END linkStaging
        case _enumUi.blundleSelect:
          _bg._popupBlundleSelectedState = $('#blundles_select option:selected').val();
          break;
        case _enumUi.blundleCreate:
          //save blundle name and categories
          break;
        case _enumUi.blundleMounted:
          _bg._popupMountedBlundleCategoryState = $('#blundle_categories option:selected').val();
          break;
        } 
        
      
      //_popupBlundleSelectedState
      });
    
    
    });//end onload  
  
  
}//end init



document.addEventListener('DOMContentLoaded', init);
