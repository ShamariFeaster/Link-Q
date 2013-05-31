var _bg = null;
var _rootId = '';
var _selectText = '';
window.rootTree = null; //global

function init(){
  $(function(){
    _bg = chrome.extension.getBackgroundPage(); 
    //set up bookmarks
    createBookmarkTreeSelect();
    //TODO: onBokmaks change, update _bg._folders
    
    $('#select').change(function(){
        _bg._rootFolderId = $('#select option:selected').val();
        //create subfolder select
        var option = {text:''};
        
        traverseTree(window.rootTree,-1000,option,_bg._rootFolderId);
        _bg._subFolders = '<select name="subfolder_select">';
        _bg._subFolders += option.text;
        _bg._subFolders += '</select>';
      });
  
  });
  
  }
  
//now this can list subfolders when passed 'searchId' of parent
function traverseTree(tree, level, option, searchId){
    var space = '';
    if(level > -1) {
      for(var x = 0; x < level; x++){
        space += '.';
      }
    }
    for(var i = 0; i < tree.length; i++){
      if(typeof tree[i].url == 'undefined' && tree[i].title != '') {
        //if search, only add children of searchId
        if(searchId != '' ) {
            if(searchId == tree[i].parentId)
              option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
          }else {
            option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
            }
        
      }
      if(typeof tree[i].children != 'undefined') {
        traverseTree(tree[i].children, level+1, option, searchId);
        }
  }
}
//select goes on option page
function createBookmarkTreeSelect(){
  chrome.bookmarks.getTree(function(tree){
        window.rootTree = tree;
        var option = {text:''};
        traverseTree(tree,0,option,'');
        _bg._folders = '<select name="folder_select">';
        _bg._folders += option.text;
        _bg._folders += '</select>';
        $('#select').html(_bg._folders);
      });

  }



document.addEventListener('DOMContentLoaded', init);
