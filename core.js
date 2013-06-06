jQuery(function(){
	jQuery('a').hover(
		//in
		function(){
			console.log(this.href);
			chrome.runtime.sendMessage({hoverURL: this.href, linkText: $(this).text(), hovering: true}, function(response) {
				console.log('hovering2');
			});
			
		}
		
		//out
		,function(){
			chrome.runtime.sendMessage({hoverURL: this.href, linkText: $(this).text(), hovering: false}, function(response) {
				console.log('not hovering');
			});
		});



  
});
