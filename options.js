var _bg = null;
var _rootId = '';
var _selectText = '';
var option = {text:''};

function init(){
  $(function(){
    _bg = chrome.extension.getBackgroundPage(); 
    //set up bookmarks
    chrome.bookmarks.getTree(function(tree){
        traverseTree(tree,0,option);
        _bg._folders = '<select name="folder_select">';
        _bg._folders += option.text;
        _bg._folders += '</select>';
        $('#select').html(_bg._folders);
      });
    //onBokmaks change, update _bg._folders
    
    $('#select').change(function(){
        _bg._rootFolderId($('#select option:selected').val());
      });
  
  });
  
  }

function traverseTree(tree, level, option){
    var space = '';
    for(var x = 0; x < level; x++){
      space += '.';
    }
    for(var i = 0; i < tree.length; i++){
      if(typeof tree[i].url == 'undefined' && tree[i].title != '') {
        //_bg.log(tree[i].id);
        option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
      }
      if(typeof tree[i].children != 'undefined') {
        traverseTree(tree[i].children, level+1, option);
        }
  }
}
function makeOptions(tree, indentLevel, option) {
  
  var space = '';
  var subTree = null;
  for(var x = 0; x < indentLevel; x++){
    space += '.';
    }
  for(var i = 0; i < tree.length; i++){
    if(typeof tree[i].url == 'undefined') {
      option.text += '<option value="' + space + tree[i].title + '">' + space + tree[i].title + '</option>';
      _bg.log(option.text);
      chrome.bookmarks.getChildren(tree[i].id, function(result){makeOptions(result, indentLevel + 1, option);});  
      }
    }
  }

function traverseBookmarks(bookmarkTreeNodes) {
  //_bg.log('hello');
    for(var i=0;i<bookmarkTreeNodes.length;i++) {
        //_bg.log(bookmarkTreeNodes[i].title);
        //_bg.log(_bg.objToString(bookmarkTreeNodes[i]));
        if(bookmarkTreeNodes[i].children) {
            traverseBookmarks(bookmarkTreeNodes[i].children);
        } 

    }
}

function createBookmarkTreeSelect(){
  var select = '<select name="folder_select">';
  chrome.bookmarks.getChildren('1', function(results){
    var option = {text:''};
    //makeOptions(results, 0, option);
    traverseBookmarks(results);
    select += option.text;
    select += '</select>';
    _bg._folders = select;
    //_bg.log(_bg._folders);
  });
  }



document.addEventListener('DOMContentLoaded', init);
