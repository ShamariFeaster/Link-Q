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
    $('#linqs').text(' Links In Queue');
    }
    
    $('#root_folder').html('<tr><td>'+_bg._folders+'</td></tr>');  
    
    //reinstating saved root folder state
    if(_bg._popupRootfolderState != ''){
      _bg.log(_bg._popupRootfolderState);
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
      
      
    $('#root_folder').change(function(){
        _bg._rootFolderId = $('#root_folder option:selected').val();
        _bg._popupRootfolderState = $('#root_folder option:selected').val();
        //create subfolder select
        var option = {text:''};
        _bg.traverseTree(_bg.window.rootTree,-1000,option,_bg._rootFolderId);
        if(option.text != ''){
          _subfolderText = '<select id="subfolder_select">';
          _subfolderText += option.text;
          _subfolderText += '</select>';
          _bg._subFolders = _subfolderText;
          }
        //so every link row gets a select, selector is class not id
        $('.subfolder_div').html(_bg._subFolders);
      });
    
    $(window).bind("unload", function() { 
      //_bg.log('beforeunload: ' + _subfolderText);
      
      //_bg.log('beforeunload: ' + _bg._folders);
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
