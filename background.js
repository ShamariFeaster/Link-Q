//Written By: Shamari A. Feaster
//Date: May 10th 2013
/*Description: This allows chrome users to browse site and add
				articles to a queue for later viewing without bookmarking
				or opening tabs.
				
TODO: Random access of queue using popup and notification of addition to queue				
				*/
				
var _pages = Array();
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
var _currentUrl = ""; //for saving state
var _lastUrl = "";

window.rootTree = null; //global

var _popupSubfolderState = '';
var _popupRootfolderState = '';

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
			if(_hovering){
				_pages.push({'text' : _contentScriptText, 'url' : _contentScriptURL, 'pinned': false, 'subfolder':'1'});
				if(window.rootTree == null)
				  createBookmarkTreeSelect();
				console.log('pushed ' + _contentScriptURL + ' onto queue');
				
			}//to add the current page 
      else{
        chrome.tabs.get(_currentTabId, function(tab){
          if(window.rootTree == null)
            createBookmarkTreeSelect();
          /*try to set title 2 ways: 
           * 1 - use <a> hover event msg from content script to grab
           *     from the 'sender' object
           * 2 - or we use the current tab's url*/  
          if(typeof _currentTabTitle == 'undefined')
            _currentTabTitle = tab.url;
          else if(_currentTabTitle == ''){
            _currentTabTitle = tab.url;
            }
          log('Trying to add current page, url is: ' + tab.url + ' title is: ' + _currentTabTitle);
          _pages.push({'text' : _currentTabTitle, 'url' : tab.url, 'pinned': false, 'subfolder':'1'});
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


//Hover Message Listener (From Content Script)
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
      _hovering = request.hovering;
      _contentScriptURL = request.hoverURL;
      _contentScriptText = request.linkText;
      //backup way for getting vurrent tab semantics
      _currentTabTitle = sender.tab.title; //could be undefined

      sendResponse({response: "Hover URL Received"});
    
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

function objToString(obj){
  var a = '';
  for(var p in obj){
    a += p + ' : ' + obj[p] + ' \n';
    }
  return a;
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
