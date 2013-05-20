var _bg = null;
function init(){
  
 //alert(_bg._pages.length);
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
        <td><button data-index="'+i+'" class="pin '+pinned+'" id="' + _bg._pages[i].url + '_pin">Pin</button></td></tr>';
      }
    $('#linqs').html(content);
  } else  {
    $('#linqs').text('No Links In Queue');
    
    }
    
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
    
    });  
  
  
  }



document.addEventListener('DOMContentLoaded', init);
