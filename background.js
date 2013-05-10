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
// Create context item for links
  var id = chrome.contextMenus.create({"title": 'Add To Link-Q', "contexts":['link'],
                                       "id": "Link-Q"});
 //Add Context Menu Option To Add To Queue
chrome.contextMenus.onClicked.addListener(function(info, tab) {
	//console.log('url: '+info.linkUrl );
	var text = info.selectionText;
	var url = info.linkUrl;

	if(typeof info.selectionText != 'undefined') {
		_pages.push({'text' : text, 'url' : url});

	}
	else {
		_pages.push({'text' : url, 'url' : url});

	}
});

//Add Shortcut To Move Through Queue
chrome.commands.onCommand.addListener(function(command) {

	if (command == "hover-add") {
			//console.log('hover Add');
			if(_hovering){
				_pages.push({'text' : _contentScriptText, 'url' : _contentScriptURL});
				//console.log('pushed ' + _contentScriptURL + ' onto queue');
				
			}
		}

		if (command == "queue-forward") {
			if(_pages.length > 0) {
				var currentQueueItem = _pages.splice(0,1)[0]; //pop off the front
				var numTabs = 0;
				if(_tabId == null) {
					chrome.tabs.create({url : currentQueueItem.url}, function(tab){
						_tabId = tab.id;
						_tabOpen = true;
						_tab = tab;
						chrome.tabs.move(_tabId, {index: -1});
						//console.log('creating new tab. tab position: ' +  _tab.index);
					});
					
				} else if(_tabOpen){
					//console.log('tab is active');
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
			}
	  }
	  
		
  
});
//Tab Closed Listener
chrome.tabs.onRemoved.addListener(
	function( closedTabId , removeInfo){
		if(_tabId != null && closedTabId == _tabId) {
			_tabOpen = false;
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
	for(var i = 0; i < _pages.length; i++){
		if(_pages[i].url != url) {
			tempArr.push(_pages[i]);
		}
	}
	return tempArr;

}
