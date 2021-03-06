//Written By: Shamari A. Feaster
//Date: May 10th 2013
/*Description: This allows chrome users to browse site and add
				articles to a queue for later viewing without bookmarking
				or opening tabs.
				
TODO: Notification of addition to queue				
				*/
				
var _pages = Array();
var _loadedBlundleQueue = Array();
var _newBlundleState = {name:'',categories:new Array()};
var _tabId = null; //this is the tab where the queue _pages will be displayed
var _tab = null;
var _tabOpen = false;
var _currentTabId = null;
var _currentTabTitle = '';
var _hovering = false;
var _contentScriptURL = "";
var _contentScriptText = "";
var _folders = '';
var _subFolders = '';
var _blundles = '';
var _rootFolderId = '';
var _blundleCategories = '';
var _currentUrl = ""; //for saving state
var _lastUrl = "";
var _currentUi = 1;

window.rootTree = null; //global
window.port = null;

var _popupSubfolderState = '';
var _popupRootfolderState = '';
var _popupBlundleSelectedState = '';
var _popupMountedBlundleState = '';
var _popupMountedBlundleCategoryState = '';

chrome.runtime.onConnect.addListener(function(port) {
  console.log('channel open');
  window.port = port;
  _currentTabId = port.sender.tab.id;
  console.log("onConnect _currentTabId: " + _currentTabId);
  port.onMessage.addListener(function(msg) {
	  _hovering = msg.hovering;
      _contentScriptURL = msg.hoverURL;
      _contentScriptText = msg.linkText;
      //backup way for getting vurrent tab semantics
      _currentTabTitle = port.sender.tab.title; //could be undefined
      
      
  });
});



// Create context item for links
  var id = chrome.contextMenus.create({"title": 'Add To Link-Q', "contexts":['link'],
                                       "id": "Link-Q"});
                                       
                                       
 //Add Context Menu Option To Add To Queue
chrome.contextMenus.onClicked.addListener(function(info, tab) {
	//console.log('url: '+info.linkUrl );
	var text = info.selectionText;
	var url = info.linkUrl;
  //you can select the text of a link but this is obsolete and should be removed
	if(typeof info.selectionText != 'undefined') {
		/* all queue items initalize with bookmarks bars as their selected subfolder*/
		_pages.push({'text' : text, 'url' : url, 'pinned': false, 'subfolder':'1'});
		if(window.rootTree == null)
			  createBookmarkTreeSelect();
	}
	else {
		_pages.push({'text' : _contentScriptText, 'url' : url, 'pinned': false, 'subfolder':'1'});
		if(window.rootTree == null)
			  createBookmarkTreeSelect();
	}
});


//Add Shortcut To Move Through Queue
chrome.commands.onCommand.addListener(function(command) {

	if (command == "hover-add") {
			console.log('hover Add');
			console.log("hover Add _currentTabId: " + _currentTabId);
			if(_hovering){
				_pages.push({'text' : _contentScriptText, 'url' : _contentScriptURL, 'pinned': false, 'subfolder':'1'});
				console.log('pushed ' + _contentScriptURL + ' onto queue');
				window.port.postMessage({output: true, pageName: _contentScriptText});
				
				if(window.rootTree == null)
					createBookmarkTreeSelect();
				
			}//to add the current page 
      else{
		  console.log("no hover _currentTabId: " + _currentTabId);
        chrome.tabs.get(_currentTabId, function(tab){
          if(window.rootTree == null)
            createBookmarkTreeSelect();
          /*try to set title 2 ways: 
           * 1 - use <a> hover event msg from content script to grab
           *     from the 'sender' object
           * 2 - or we use the current tab's url*/  
          if(typeof _currentTabTitle == 'undefined')
            _currentTabTitle = tab.title;
          else if(_currentTabTitle == ''){
            _currentTabTitle = tab.title;
            }
          log('Trying to add current page, url is: ' + tab.url + ' title is: ' + _currentTabTitle);
         
          _pages.push({'text' : _currentTabTitle, 'url' : tab.url, 'pinned': false, 'subfolder':'1'});
          window.port.postMessage({output: true, pageName: _currentTabTitle});
          });

        }
	}
    /*The idea here is to not pop off the queue until we move to
     * the next mark, allowing user to pin and save from the popup*/
		if (command == "queue-forward") {
      //<<<This doesn't work>>>>
			removeFromQueue(_lastUrl); //wont remove if last is pinned 
      if(getFromQueue(_lastUrl).pinned == true)
        openLink(getFromQueue(''), false);  //so we get first unpinned using getFromQueue('')
      else
        openLink(_pages, false);  //however if it's not pinned we just pop off the front
      _lastUrl = _currentUrl;
      
      
      
	  } 
});

function openLink(queueObj, openIfEmpty){
	console.log('pages  length: '+_pages.length);

	var currentQueueItem;
    if(_pages.length > 0 || openIfEmpty) {
      if(Array.isArray(queueObj)) { //if _pages is passed pop off front
        currentQueueItem = queueObj[0]; //queueObj.splice(0,1)[0];
      } else{ //else we know the object has already been popped off _pages
        currentQueueItem = queueObj;
      }
      _currentUrl = currentQueueItem.url;
      var numTabs = 0;
      if(_tabId == null) {
        chrome.tabs.create({url : currentQueueItem.url}, function(tab){
          _tabId = tab.id;
          _tabOpen = true;
          _tab = tab;
          chrome.tabs.move(_tabId, {index: -1});
          console.log('creating new tab. tab position: ' +  _tab.index);
        });
        
      } else if(_tabOpen){
        console.log('tab is active');
        chrome.tabs.update(_tabId, {url: currentQueueItem.url});
        
      } else if(!_tabOpen){
        chrome.tabs.create({url : currentQueueItem.url, index : numTabs}, function(tab){
          _tabId = tab.id;
          _tabOpen = true;
          _tab = tab;
          chrome.tabs.move(_tabId, {index: -1});
        });
      }

	} else {
		if(_tabOpen)
			chrome.tabs.remove(_tabId);
			console.log('if failed, removing tab');
	}
  
}

function openLinkFromBlundle(url){
    console.log('blundleQueue length: '+ _loadedBlundleQueue.length);
    console.log('opening ' + url);
      var numTabs = 0;
      if(_tabId == null) {
        chrome.tabs.create({url : url}, function(tab){
          _tabId = tab.id;
          _tabOpen = true;
          _tab = tab;
          chrome.tabs.move(_tabId, {index: -1});
          console.log('creating new tab. tab position: ' +  _tab.index);
        });
        
      } else if(_tabOpen){
        console.log('tab is active');
        chrome.tabs.update(_tabId, {url: url});
        
      } else if(!_tabOpen){
        chrome.tabs.create({url : url, index : numTabs}, function(tab){
          _tabId = tab.id;
          _tabOpen = true;
          _tab = tab;
          chrome.tabs.move(_tabId, {index: -1});
        });
      }
}

chrome.runtime.onStartup.addListener(function() {
  log('extension started');
  });

//Tab Closed Listener
chrome.tabs.onRemoved.addListener(
	function( closedTabId , removeInfo){
		if(_tabId != null && closedTabId == _tabId) {
			_tabOpen = false;
		}
});

//this is to capture the opening tab on chrome startup
chrome.tabs.onCreated.addListener(function(tab) {
  if(_currentTabId == null) {
    _currentTabId = tab.tabId;
    _currentTabTitle = tab.title; //could be undefined
  }
});
//captures current tab information
chrome.tabs.onActivated.addListener(function(tab) {
  _currentTabId = tab.tabId;
  _currentTabTitle = tab.title; //could be undefined
});

//BOOKMARK EVENT LISTENERS
chrome.bookmarks.onRemoved.addListener(function(id, changeInfo){
  log('EVENT: bookmarks have been removed. Reloading tree');
  createBookmarkTreeSelect();
});

function /*Queue Object*/removeFromQueue(url){
	var tempArr = Array();
  var queueObj = null;
	for(var i = 0; i < _pages.length; i++){
    //push all that arent url, unless url is pinned
		if(_pages[i].url != url || _pages[i].pinned == true) {
			tempArr.push(_pages[i]);
		} else {
      queueObj = _pages[i];
      console.log('removed ' + _pages[i].url);
      }
	}
	_pages = tempArr;
  return queueObj;

}

function /*Queue Object*/removeFromBlundle(url){
	var tempArr = Array();
  var queueObj = null;
	for(var i = 0; i < _loadedBlundleQueue.length; i++){
    //push all that arent url, unless url is pinned
		if(_loadedBlundleQueue[i].url != url) {
			tempArr.push(_loadedBlundleQueue[i]);
		} else {
      queueObj = _loadedBlundleQueue[i];
      console.log('removed ' + _loadedBlundleQueue[i].url);
      }
	}
	_loadedBlundleQueue = tempArr;
  return queueObj;
}

function emptyQueue(){
  while(_pages.length){
		_pages.pop();
	}
}

function /*void*/togglePin(url){
	for(var i = 0; i < _pages.length; i++){
		if(_pages[i].url == url) {
			if(_pages[i].pinned == false) {
        _pages[i].pinned = true;  
        return true;
      }
      else {
        _pages[i].pinned = false;
        return false;
      }
		} 
	}
}

function /*void*/toggleBlundlePin(url){
	for(var i = 0; i < _loadedBlundleQueue.length; i++){
		if(_loadedBlundleQueue[i].url == url) {
      log(_loadedBlundleQueue[i]);
			if(_loadedBlundleQueue[i].pinned == false) {
        _loadedBlundleQueue[i].pinned = true;  
        return true;
      }
      else {
        _loadedBlundleQueue[i].pinned = false;
        return false;
      }
		} 
	}
}

//if url is '', returns the first non-pinned item
function /*Queue Object*/ getFromQueue(url){
	for(var i = 0; i < _pages.length; i++){
		if(url != '') {
      if(_pages[i].url == url) {
        return _pages[i];
      }
    } else {
      if(_pages[i].pinned == false)
        return _pages[i];
      else
        continue;
      }
	}
}

function /*Queue Object*/ getFromBlundleQueue(url){
	for(var i = 0; i < _loadedBlundleQueue.length; i++){
		if(url != '') {
      if(_loadedBlundleQueue[i].url == url) {
        return _loadedBlundleQueue[i];
      }
    } else {
      if(_loadedBlundleQueue[i].pinned == false)
        return _loadedBlundleQueue[i];
      else
        continue;
      }
	}
}

function objToString(obj){
  var a = '';
  for(var p in obj){
    a += p + ' : ' + obj[p] + ' \n';
    }
  return a;
  }

function emptyLoadedBlundleArray(){
  log('emptying queue');
  while(_loadedBlundleQueue.length > 0){
		_loadedBlundleQueue.pop();
    //log('queue length now: ' + _loadedBlundleQueue.length);
	} 
  
  }

//now this can list subfolders when passed 'searchId' of parent
//ONLY LISTS FOLDERS, return semantics: options list 
//option = {text:''}
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
//adds filtering by mark type (folders or links) when searching
//like it's predecessor it builds options list for html select
function traverseTreeV2(tree, level, option, searchId, onlyShowFolders){ 
    log(searchId);
    var space = '';
    if(level > -1) {
      for(var x = 0; x < level; x++){
        space += '.';
      }
    }
    for(var i = 0; i < tree.length; i++){
      if(tree[i].title != '') {
        //if search, only add children of searchId
        if(searchId != '' ) {
            //only show links
            if(!onlyShowFolders && typeof tree[i].url != 'undefined' && searchId == tree[i].parentId){
              option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
            }
            //only show folder  
            else if(onlyShowFolders && typeof tree[i].url == 'undefined' && searchId == tree[i].parentId){
              log('WHY?');
              option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
              }
          }else {
            option.text += '<option value="' + tree[i].id + '">' + space + tree[i].title + '</option>';
            }
        
      }
      if(typeof tree[i].children != 'undefined') {
        traverseTreeV2(tree[i].children, level+1, option, searchId, onlyShowFolders);
        }
  }
}
/*option = Array();
 * This is used to pull links out of blundles and push them onto
 * option. 
*/
function traverseTreeV3(tree, option, searchId, onlyShowFolders){ 
    
    for(var i = 0; i < tree.length; i++){
      if(tree[i].title != '') {
        //if search, only add children of searchId
        if(searchId != '' ) {
            //only show links
            if(!onlyShowFolders && typeof tree[i].url != 'undefined' && searchId == tree[i].parentId){
              //log(tree.length + ' searchId: ' + searchId + ' parentId: ' + tree[i].parentId);
              option.push({'title' : tree[i].title, 'url' : tree[i].url, 'id' : tree[i].id, 'parentId' : tree[i].parentId, 'pinned' : false, 'subfolder' : tree[i].parentId});
            }
            //only show folder  
            else if(onlyShowFolders && typeof tree[i].url == 'undefined' && searchId == tree[i].parentId){
              option.push({'title' : tree[i].title, 'url' : '', 'id' : tree[i].id, 'parentId' : tree[i].parentId, 'pinned' : false, 'subfolder' : tree[i].parentId});
              }
          }else {
            log('traverseTreeV3 didnt run. no searchId given');
            }
        
      }
      if(typeof tree[i].children != 'undefined') {
        traverseTreeV3(tree[i].children, option, searchId, onlyShowFolders);
        }
  }
}

function isThisBlundle(tree, parentId){
    //console.log('starting at id ' + parentId);
    var isBlundle = 0;
    var parent;
    for(var i = 0; i < tree.length; i++){
      parent = tree[i].title;
      //check for .blundle file
      if(typeof tree[i].children != 'undefined') {
        for(var o = 0, node = tree[i].children; o < node.length; o++) {
            //log('looking at ' + node[o].title + ' under ' + parent + ' <br> ' + node[o].parentId + ' == ' + parentId);
            if(node[o].title == '.blundle' && node[o].parentId == parentId) {
              log('FOUND: ' + node[o].title + ' under ' + parent + ' ' + node[o].parentId + ' == ' + parentId);
              
              isBlundle = 1;
              break;
            }
          }
        }

      
      if(typeof tree[i].children != 'undefined') {
        //log('going into ' + tree[i].children[0].title);
        isBlundle += isThisBlundle(tree[i].children, parentId);
        }
      
  }
  console.log('returning ' + isBlundle);
  return isBlundle;
}

function getBlundlesFromTree(tree, option){
    var isBlundle = false;
    for(var i = 0; i < tree.length; i++){
      //check for .blundle file
      if(typeof tree[i].children != 'undefined') {
        for(var o = 0, node = tree[i].children; o < node.length; o++) {
            if(node[o].title == '.blundle') {
              log('blundle found.');
              isBlundle = true;
              break;
            }
          }
        }
      //only adding if .blundle file is present    
      if(typeof tree[i].url == 'undefined' && tree[i].title != '' && isBlundle == true) {
        option.text += '<option value="' + tree[i].id + '">' + tree[i].title + '</option>';
      }
      
      if(typeof tree[i].children != 'undefined') {
        getBlundlesFromTree(tree[i].children, option);
        }
      isBlundle = false;
  }
}

//select goes on option page
function createBookmarkTreeSelect(){
  chrome.bookmarks.getTree(function(tree){
        window.rootTree = tree;
        var option = {text:''};
        traverseTree(tree,0,option,'');
        _folders = '<select id="folder_select">';
        _folders += option.text;
        _folders += '</select>';
        log('Running createBookmarkTreeSelect()');
      });

  }

function log(msg) {console.log(msg)};

function setUiState(newUiState){
  _currentUi = newUiState;
  }
  
function getUiState(){return _currentUi}
