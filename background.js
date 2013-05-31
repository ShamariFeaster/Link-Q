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
var _hovering = false;
var _contentScriptURL = "";
var _contentScriptText = "";
var _folders = '';
var _rootFolderId = '';
var _currentUrl = ""; //for saving state
var _lastUrl = "";
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
		_pages.push({'text' : text, 'url' : url, 'pinned': false});

	}
	else {
		_pages.push({'text' : url, 'url' : url, 'pinned': false});

	}
});

//Add Shortcut To Move Through Queue
chrome.commands.onCommand.addListener(function(command) {

	if (command == "hover-add") {
			console.log('hover Add');
			if(_hovering){
				_pages.push({'text' : _contentScriptText, 'url' : _contentScriptURL, 'pinned': false});
				console.log('pushed ' + _contentScriptURL + ' onto queue');
				
			}
		}

		if (command == "queue-forward") {
			_lastUrl = _currentUrl;
      removeFromQueue(_lastUrl);
      var queueObj = (getFromQueue('') == null) ? _pages : getFromQueue('');
			openLink(queueObj, false);  //pop off the front
      
	  } 
});
function log(msg) {console.log(msg)};

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

//Tab URL change Listener
chrome.tabs.onUpdated.addListener(
	function( tabId , removeInfo, tab){
		if(tabId == _tabId) {

		}
		
});


//Hover Message Listener (From Content Script)
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//console.log(request.hoverURL + ' ' + request.linkText);
		_hovering = request.hovering;
		_contentScriptURL = request.hoverURL;
		_contentScriptText = request.linkText;
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
        return null;
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


