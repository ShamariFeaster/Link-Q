var _bg = null;
var __subfolderText = '';
function init(){

$(function(){
  _bg = chrome.extension.getBackgroundPage();  
  
  var content = "";
  var linkText = "";
  var url = "";
  var pinned = "";
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
        <td><div class="subfolder_div">' + _bg._subFolders + '</div></td></tr>';
      }
    $('#linqs').html(content);
    

      
  } else  {
    $('#linqs').text('No Links In Queue');
    }
    //display root folder select
    $('#root_folder').html('<tr><td>'+_bg._folders+'</td><td><button id="empty_queue">Clear Queue</button></td></tr> \
							<tr><td><button id="save_pinned">Save Pinned</button></td></tr>');  
    
    //reinstating saved root folder state
    if(_bg._popupRootfolderState != ''){
      $('#folder_select').val(_bg._popupRootfolderState);
    }
    
    //reinstating subfolder state
    //TODO: dont do this unecessaraly, consider flag of some sort
    $('#linqs tr').each(function(index, link){
        var url = $(link).find('.link').attr('id');
        var queueObj = _bg.getFromQueue(url);
        if(queueObj.subfolder != ''){
          $(link).find('#subfolder_select').val(queueObj.subfolder);
        }
        
        });
    
    $('button.link').click(function(e){
      var id = $(this).attr('id');
      _bg._lastUrl = _bg._currentUrl;
      _bg.openLink( _bg.getFromQueue(id) , true);
      if(_bg._lastUrl != _bg._currentUrl && _bg._tabOpen){
        _bg.removeFromQueue(_bg._lastUrl);
        }
      
      });
    
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
	//
	$('#linqs').change(function(){
		_bg.log('subfolder was changed: ' + $(this).html());
		var url = $(this).find('.link').attr('id');
        var queueObj = _bg.getFromQueue(url);
        queueObj.subfolder = $(this).find('option:selected').val();
		_bg.log('\nId of selected subfolder: '+ queueObj.subfolder);
	});
	
    $('#root_folder').change(function(){
        _bg._rootFolderId = $('#root_folder option:selected').val();
        _bg._popupRootfolderState = $('#root_folder option:selected').val();
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
      });
    
	//when popup is closed, cleanup stuff
    $(window).bind("unload", function() { 
	  /*this may be unecessary because im saving subfolder state through
	  events in the function above, leaving it for now since it's an optimization 
	  to remove it - want to continue*/
      $('#linqs tr').each(function(index, link){
        var url = $(link).find('.link').attr('id');
        var subfolder = $(link).find('#subfolder_select').val();
        var queueObj = _bg.getFromQueue(url);
        queueObj.subfolder = subfolder;
        });
      });
    
    
    });//end onload  
  
  
}//end init



document.addEventListener('DOMContentLoaded', init);
