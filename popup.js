/*
 * 7/9/13 - 
 * ISSUES: 
 *    blundleCreate:
 *      1. need to reload tree when created so user can immediately use the new blundle (FIXED)
 * 
 *    blundleMounted
 *      1. Crashes on unload after mount (FIXED)
 *      2. after mounted, then unload, next load shows empty blundle (FIXED)
 *      3. back buttons don't work (FIXED)
 *      
 *    linkStaging
 *      1. Pinning not working until popup is reloaded
 *      2. When Blundle loaded this need only to show links from loaded blundle
 *         and a way to unmount it
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
      setupMountedBlundleState(_bg._popupMountedBlundleState, false);
      break;
    }
  
    function setupLinkStaging(){
      _bg.setUiState(_enumUi.linkStaging);
      $('button.pin').unbind();
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
            <td><div class="rename" id="' + _bg._pages[i].url + '"><button id="rename_button">Rename Mark</button></div></td>\
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
                    <td><button id="save_pinned" value="linkstageMod">Save Pinned</button></td> \
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
      
      //pins mark
    $('button.pin').click(function(e){
        _bg.log('pin clicked');
        var url = $(this).attr('id');
        url =  url.replace('_pin', '');
        if(_bg.togglePin(url) == true) {
          $(this).toggleClass('pinned', true);
        } else{
          $(this).toggleClass('pinned', false);
        }
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
            _bg.log('Blundle Load Clicked'); 
            setupMountedBlundleState($('#blundles_select option:selected').val(), false);
            
          }); 
      }
    
    function printHtml(id) {
      _bg.log('########PRINT HTML OUTPUT FOR: ' + id);
      _bg.log($(id).html());
      _bg.log('########END HTML OUTPUT FOR: ' + id);
      }
    
    function setupMountedBlundleState(blundleToMount, isReload){
      if(!isReload)
        _bg.log('setupMountedBlundleState called NOT a reload');
      else
        _bg.log('setupMountedBlundleState called IS a reload');
      _bg.setUiState(_enumUi.blundleMounted);
      _bg._popupMountedBlundleState = blundleToMount; //save mounted blundle state

      window.blundleLoaded = true;

      $('#back_to_blundle_select').unbind();
      $('#blundle_categories').unbind();
      $('#back_to_blundle_select').unbind();
      //$('button.pin').unbind();
      var option = {text: ''};
      var optionsText = '';
      //_bg.log($('#blundles_select option:selected').val());
      
      var btnUnmountBlundle = '<button id="unmount_blundle">Unload Blundle</button>\
                               <button id="remove_pinned_links">Remove Pinned Links</button>';
      
      if(!isReload)
        _bg.emptyLoadedBlundleArray();
        
      //Tree is reloaded right after save, it's not reloaded quick enough though!!!!!
      _bg.traverseTree(_bg.window.rootTree, -1000, option, blundleToMount);
      
      _bg.log('Waiting for options to load');  
      for(var i = 0;i < 100000000;i++){
        if(option.text == '')
          continue;
        else
          break;
      }
      _bg.log('Options loaded');
          
      if(option.text == ''){
        _bg._blundleCategories = '';
      }else{
        _bg._blundleCategories = '<select id="blundle_categories"></select>';
      }
      
      _bg._blundleCategories = '<select id="blundle_categories"></select>';
      //_bg._blundleCategories = (_bg._blundleCategories == '') ? 'This Blundle Is Empty' : _bg._blundleCategories;
      
      $('#load_bundle_gui').hide(); //hide loading gui
     
      $('#loaded_blundle_categories').html(btnUnmountBlundle + '<br>' + _bg._blundleCategories);

      $('#blundle_categories').html(option.text);
      
      //populating blundle queue
      if(!isReload){
        $('#blundle_categories option').each(function(index, category){
          //_bg.log('cat index ' + index + ' search id: ' + $(category).val());
          _bg.traverseTreeV3(_bg.window.rootTree, _bg._loadedBlundleQueue, $(category).val(), false);
          var currSize = 0;
          var sameSizeCtr = 1;
          _bg.log('Waiting for array to load from ' + $(category).val());  
          for(var i = 0;i < 10000000;i++){
            if(_bg._loadedBlundleQueue.length == currSize){ //Make This wait for array size to be maxed
              
              if(sameSizeCtr++ > 5000000){
                _bg.log('Size Limit Reached: EXITTING');
                break;
              }
              
              continue;
            } else {
              currSize = _bg._loadedBlundleQueue.length;
              _bg.log('Array Size is Now: ' + currSize);
            }
          }
          _bg.log('Array loaded from ' + $(category).val());
        
        });
      }
      _bg._blundleCategories = $('#blundle_categories').html();
      //_bg.log('blundle cat: ' + $('#blundle_categories').html());
      //reinstating previous category state
      if(_bg._popupMountedBlundleCategoryState != ''){
        $('#blundle_categories').val(_bg._popupMountedBlundleCategoryState); 
        
      }
      
      _bg.log('length of queue: after traversial' + _bg._loadedBlundleQueue.length);
      var links = filterLinksInQueue(_bg._loadedBlundleQueue, $('#blundle_categories option:selected').val());
      $('#loaded_blundle_linqs').html(links);
      //_bg.log($('#blundle_categories').html());
      
      
      
      $('#loaded_blundle_menu').html('<button id="back_to_blundle_select">Back</button><br>');
      $('#loaded_blundle_menu').append('<button class="show_current" id="show_current_queue">Show Links Currently In Queue</button>');
      $('#loaded_blundle_gui').show();
      
      //DISPLAY CURRENT LINK QUEUE
      var linkText = '',
          url = '',
          pinned = '',
          content = '';
      
          
      for(var i = 0; i < _bg._pages.length; i++){
        if(_bg._pages[i].text.length == 0) {
          url = _bg._pages[i].url.replace(/(http:\/\/|https:\/\/)/, "");
          linkText = url.substr(0, url.indexOf('/'));
        } else {
          linkText = _bg._pages[i].text;
          }
        
        _bg._pages[i].subfolder = (typeof _bg._pages[i].subfolder == 'undefined') ? 
                                  $('#blundle_categories option:selected').val() : _bg._pages[i].subfolder;
        
        _bg.log('link ' + i + '\'s subfolder is ' + _bg._pages[i].subfolder);  
        
        pinned = (_bg._pages[i].pinned) ? 'pinned' : "";
        content += '<tr><td><button class="currentLink" id="' + _bg._pages[i].url + '">' + linkText + '</button></td> \
                        <td><button data-index="'+i+'" class="pin '+pinned+'" id="' + _bg._pages[i].url + '_pin">Pin</button></td> \
                        <td><div class="rename" id="' + _bg._pages[i].url + '"><button id="rename_button">Rename Mark</button></div></td>\
                        <td><select id="current_link_blundle_categories"></select></td>\
                    </tr>';
      }
      
      $('#loaded_blundle_current_linqs').html(content);
      $('#loaded_blundle_current_linqs').append('\
        <button id="save_pinned_to_blundle" value="blundleMod">Save Pinned To This Blundle</button><br>');
      
      
      
      //PUT CATEGORY SELECTS ON CURRENT LINKS
       $('#loaded_blundle_current_linqs tr').each(function(index,row){
        $row = $(row);
        $row.find('#current_link_blundle_categories').html(option.text);
        //_bg.log('_bg._pages[index].subfolder: ' + _bg._pages[index].subfolder);
        $row.find('#current_link_blundle_categories').val(_bg._pages[index].subfolder);
       });

        //EVENT HANDLERS
      $('button.blundleLink').click(function(e){
         var url = $(this).data('url');
         _bg.log('blundleLink clicked. opening ' + url);
         _bg.openLinkFromBlundle(url);
        });
        
        $('#back_to_blundle_select').click(function(){
          $('#loaded_blundle_gui').hide();
          setupSelectBlundle();
          });
          
        $('#blundle_categories').change(function(){
          
          _bg._popupMountedBlundleCategoryState = $('#blundle_categories option:selected').val();
          var links = filterLinksInQueue(_bg._loadedBlundleQueue, $('#blundle_categories option:selected').val());
          $('#loaded_blundle_linqs').html(links);
          //_bg.log('option.text: ' + $('#blundle_categories option:selected').val());
          updateExistingBlundleLinkSubfolder($('#blundle_categories option:selected').val());
          //_bg.log('option.text: ' + option.text);
          $('.blundle_subfolder_div').html('<select class="blundle_categories"></select>');
          
          $('.blundle_subfolder_div').find('select').html(option.text);
          
        });
          
        $('#unmount_blundle').click(function(){
            _bg._blundleCategories = '';
             _bg._popupMountedBlundleCategoryState = '';
             window.blundleLoaded = false;
            $('#loaded_blundle_gui').hide();
            setupSelectBlundle();
            
          });
          
        //TOGGLE HIDE/SHOW OF CURRENT LINQS  
        $('#show_current_queue').click(function(){
            //style="border:1px solid black;"
            if($('#show_current_queue').hasClass('show_current')){
              $('#loaded_blundle_current_linqs').show();
              $('#show_current_queue').text('Hide Links Currently In Queue');
              $('#show_current_queue').toggleClass('show_current');
            }else{
              $('#loaded_blundle_current_linqs').hide();
              $('#show_current_queue').text('Show Links Currently In Queue');
              $('#show_current_queue').toggleClass('show_current');
            }
              
          
          $('#loaded_blundle_current_linqs').css({'border' :'1px solid black', 'visibility' : 'visible'});  
          
          //printHtml('loaded_blundle_gui');
          });

          $('#loaded_blundle_current_linqs tr').change(function(){
            updateCurrentLinkSubfolder();
            });
            
        $('button.pin').click(function(e){
          _bg.log('pin clicked');
          var url = $(this).attr('id');
          url =  url.replace('_pin', '');
          //_bg.log('blunde toggle: ' + _bg.toggleBlundlePin(url));
          if(_bg.togglePin(url) == true | _bg.toggleBlundlePin(url)) {
            $(this).toggleClass('pinned');
          } else{
            $(this).toggleClass('pinned');
          }
        });

      }//END MOUNTED BLUNDLE SETUP
    
    function setupNewBlundle(){
      _bg.setUiState(_enumUi.blundleCreate);
      $('#linqs').hide();
      $('#root_folder').hide();
        var newBundleHtml = '<tr><td><div id="new_blundle_save_status"></div></td></tr> \
                            <tr id="new_subfolders_input">\
                                <td>Bundle: </td><td><input id="new_bundle_name" type="text" size="20"></textarea></td> \
                                <td><button id="add_subfolder">Add Category</button></td> \
                                <td><button id="save_bundle">Save This Bundle</button></td>\
                             </tr>\
                             <tr>\
                                <td><button id="back_to_linqs">Back</button></td>\
                             </tr>';
        $('#new_bundle_gui').html(newBundleHtml); //maybe not working because id's aren't visible, 
        $('#new_bundle_gui').show();
        reinstateNewBlundleState();
         $('#add_subfolder').unbind(); //prevent mutiple action due to duplicate handlers
         $('#back_to_linqs').unbind();
         $('.category_row').unbind();
          
        //handlers for adding and removing subfolder rows 
        $('#add_subfolder').click(function(e){
          $('.new_blundle_categories').last().append('\
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
              if($row.find('.subfolder_name').val())
                window.categories.push({name: $row.find('.subfolder_name').val()}); 
            });
            
            //create root in 'other bookmarks' (for now)
            chrome.bookmarks.create({title: $('input#new_bundle_name').val()}, function(blundle){

              var blundleObj = {};
              blundleObj.blundleName = $('input#new_bundle_name').val();
              blundleObj.categories = [];
              blundleObj.created = new Date().getTime();
              
              if(typeof blundle.id != 'undefined') {
                //create category folder underneth root
                for(var i = 0; i < window.categories.length; i++){
                  chrome.bookmarks.create({parentId: blundle.id, title: window.categories[i].name});
                  blundleObj.categories.push(window.categories[i].name);
                  }

                //create .blundle file
                var encodedBlundle = encodeURIComponent(JSON.stringify(blundleObj)),
                    blundleInfo = "http://blundle.com?info=" + encodedBlundle;
                //send blundle JSON to server here
                chrome.bookmarks.create({parentId: blundle.id, title: '.blundle', url: blundleInfo}, function(){
                    _bg.createBookmarkTreeSelect(); //reload tree to show this blundle
                    
                    //clear new blundle interface
                    $('input#new_bundle_name').val('');
                    $('.category_row').each(function(index, row){
                      $(row).remove();
                      });
                    //Indicate blundle saved  
                    $('#new_blundle_save_status').hide();
                    $('#new_blundle_save_status').text('Blundle Saved');
                    $('#new_blundle_save_status').fadeIn().delay(500).fadeOut(1500);
                  });
                
              }

            });

          });
    
        //switches back to bundle edit mode
        $('#back_to_linqs').click(function(e){
            _bg.log('Going back to link staging from blundle create'); 
            saveNewBlundleState();
            setupLinkStaging();
            $('#new_subfolders_input').remove();
            $('#new_bundle_gui').hide();
            $('#root_folder').show();
            $('#linqs').show();
            reinstateLinkSubfolders();
          });
      }
    
    /* returns DOM with filtered links as buttons
     * */
    function filterLinksInQueue(/*Array*/queue, /*int*/categoryId){
        var content = '';
        var pinned = '';
        //_bg.log('hello');
        for(var i = 0; i < queue.length; i++){
          //_bg.log(queue[i].parentId + categoryId);
          if(!queue[i].url == '' && queue[i].parentId == categoryId){ //only links, no folders
            //buttons += '<button class="blundleLink" data-url="' + queue[i].url + '">' + queue[i].title + '</button>';
            pinned = (queue[i].pinned) ? 'pinned' : "";
            content += '<tr><td><button class="blundleLink" data-url="'+ queue[i].url +'" id="' + queue[i].url + '">' + queue[i].title + '</button></td> \
                          <td><button data-index="'+i+'" class="pin '+pinned+'" id="' + queue[i].url + '_pin">Pin</button></td> \
                          <td><div class="rename" id="' + queue[i].url + '"><button id="rename_button">Rename Mark</button></div></td>\
                          <td><div class="blundle_subfolder_div"></div></td>\
                        </tr>';
          }
        }
        return content;
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
	}); //END div.rename
  
    
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
	$('button#save_pinned, button#save_pinned_to_blundle').click(function(e){
		var mark = null;
		var queue = _bg._pages;
		for(var i = 0; i <= queue.length; i++){
			mark = queue[i];
			if(mark.pinned == true){
				chrome.bookmarks.create({parentId: mark.subfolder, title: mark.text, url: mark.url }, function(node){
					if(typeof node.id != 'undefined')
						_bg.log('Bookmark was made');
            if(e.target.value == 'blundleMod'){
              _bg.log('Size: ' + _bg._loadedBlundleQueue.length +' New Size: ' + 
                _bg._loadedBlundleQueue.push({'title' : node.title, 'url' : node.url, 'id' : node.id, 'parentId' : node.parentId , 'pinned' : false, 'subfolder' : node.parentId})
              );
              _bg.createBookmarkTreeSelect();
              setupMountedBlundleState(_bg._popupMountedBlundleState, true);//reload blundle modification interface
              }
				});
			}
		}
    
	});	
  
  $('button#remove_pinned_links').click(function(e){
		var mark = null;
		var queue = _bg._loadedBlundleQueue;
    var url = '';
    _bg.log('Removal Clicked');
		for(var i = 0; i <= queue.length; i++){
			mark = queue[i];
      url = queue[i].url;
      _bg.log('pinned: ' + mark.pinned);
			if(mark.pinned == true){
        _bg.log('Removing ' + mark.title + ' from blundle. Id is ' + mark.id);
				chrome.bookmarks.remove( mark.id , function(){
          _bg.removeFromBlundle(url); 
          _bg.createBookmarkTreeSelect();
          setupMountedBlundleState(_bg._popupMountedBlundleState, true);//reload blundle modification interface
      
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
      //var links = filterLinksInQueue(_bg._loadedBlundleQueue, $('#blundle_categories option:selected').val());
      //$('#loaded_blundle_linqs').html(links);
	});
  
  /*This is the callback when new root is chosen from link staging
   * Its primary function is to create subfolder selects for
   * each link*/
  function updateRootAndSubs(newRoot){
    _bg._rootFolderId = newRoot;
    _bg._popupRootfolderState = newRoot;
		var _subfolderText = '';
    //create subfolder select (TODO: PUT IN FUNCTION)
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
  //Actually updates where links in existing blundle will go if they are saved
  function updateExistingBlundleLinkSubfolder(newCategory){
		$('#loaded_blundle_linqs tr').each(function(index, link){
				var url = $(link).find('.blundleLink').attr('id');
				var queueObj = _bg.getFromBlundleQueue(url);
				queueObj.subfolder = newCategory;
				//_bg.log('root for ' + $(link).find('.blundleLink').text() + ' is ' + queueObj.subfolder);
		});
    
    
  }
  
  //Updates where links in current queue will go if they are saved to loaded blundle
  function updateCurrentLinkSubfolder(){
		$('#loaded_blundle_current_linqs tr').each(function(index, link){ //traverse rows of current links
				var url = $(link).find('.currentLink').attr('id');
				var queueObj = _bg.getFromQueue(url);
				queueObj.subfolder = $(link).find('#current_link_blundle_categories option:selected').val();
				_bg.log('root for ' + $(link).find('.currentLink').text() + ' is ' + queueObj.subfolder);
		});
    
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

  function saveNewBlundleState(){
    _bg.log('saving new blundle state ' + $('#new_bundle_name').val());
      _bg._newBlundleState.name = $('#new_bundle_name').val();
      _bg._newBlundleState.categories.length = 0;
      $('tr.category_row').each(function(index, row){
          $subfolderField = $(row).find('input.subfolder_name');
          _bg._newBlundleState.categories.push($subfolderField.val());
          row.remove();
        });
        _bg.log('leaving save new blundle state and length is ' + _bg._newBlundleState.categories.length);
      
    }
    
    function reinstateNewBlundleState(){
      _bg.log('reinstating new blundle state ' + _bg._newBlundleState.categories.length);
      $('#new_bundle_name').val(_bg._newBlundleState.name);
      
      for(var x = 0; x < _bg._newBlundleState.categories.length;x++){
        _bg.log(_bg._newBlundleState.categories[x] + ' ');
        $('.new_blundle_categories').last().append('\
          <tr class="category_row">\
            <td>Category: </td><td><input class="subfolder_name" type="text" size="20"></textarea></td>\
            <td><button id="remove_category">Remove Category</button></td>\
          </tr>');
        }
        $('input.subfolder_name').each(function(index, category){
          $(category).val(_bg._newBlundleState.categories[index]);
        });
      }
	//when popup is closed, cleanup stuff
    $(window).bind("unload", function() { 
      _bg.log('unloading');
      
        
       switch(_bg.getUiState()){
        case _enumUi.linkStaging:
          saveLinkStageState();
          _bg._popupRootfolderState = $('#folder_select option:selected').val();
          break;//END linkStaging
        case _enumUi.blundleSelect:
          _bg._popupBlundleSelectedState = $('#blundles_select option:selected').val();
          break;
        case _enumUi.blundleCreate:
          saveNewBlundleState();
          break;
        case _enumUi.blundleMounted:
          break;
        } 
        
      
      //_popupBlundleSelectedState
      });
    
    
    });//end onload  
  
  
}//end init



document.addEventListener('DOMContentLoaded', init);
