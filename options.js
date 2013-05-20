var _bg = null;
var _rootId = '';
var _selectText = '';
function init(){
  $(function(){
    _bg = chrome.extension.getBackgroundPage(); 
    $('button#folder_search').click(function(e){

      //_bg.log($('#query_text').val());
       createBookmarkTreeSelect($('#query_text').val());
       
    });
  });
  
  }

  
function createBookmarkTreeSelect(folderName){
  var select = '<select name="folder_select">';
  chrome.bookmarks.getChildren('1', function(results){
  for(var i = 0; i < results.length; i++){
    //_bg.log(results[i].title);
    _bg.log('id: '+results[i].id + ' title: ' + results[i].title);
    if(results[i].title == folderName){
      _rootId = results[i].id;
      }
    }
    
  chrome.bookmarks.getChildren(_rootId ,function(treeNodeArray){
    for(var i = 0;i < treeNodeArray.length; i++) {
      if(typeof treeNodeArray[i].url == 'undefined'){
        select += '<option value="' + treeNodeArray[i].title + '">'
                  + treeNodeArray[i].title + '</option>';
        }
      }
    select += '</select>';
    _bg._folders = select;
    });
  

  });
  
  
  }



document.addEventListener('DOMContentLoaded', init);
