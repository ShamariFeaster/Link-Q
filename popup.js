var _bg = null;
function init(){
  
 //alert(_bg._pages.length);
$(function(){
  _bg = chrome.extension.getBackgroundPage();    
  var content = "";
  var linkText = "";
  var url = "";
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
        content += '<button id="' + _bg._pages[i].url + '">' + linkText + '</button>';
      }
    $('#linqs').html(content);
  } else  {
    $('#linqs').text('No Links In Queue');
    
    }
    
    $('button').click(function(e){
      var id = $(this).attr('id');
	  _bg.lastUrl = id;
      _bg.openLink( _bg.getFromQueue(id) , true);
	  /*
      $(this).hide( "slide", {percent: 0}, 375, function(){
          if(_bg._pages.length < 1)
            window.close();
        });
		*/
      
      });
    
    
    });  
  
  
  }



document.addEventListener('DOMContentLoaded', init);
