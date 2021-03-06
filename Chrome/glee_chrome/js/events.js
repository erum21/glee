Glee.Events = {
    
    // called when tab key is pressed inside gleebox
    onTabKeyDown: function(e) {
        if(Glee.selectedElement)
		{
		    // If Shift is pressed, scroll to previous element
			if(e.shiftKey)
				Glee.selectedElement = LinkReaper.getPrev();
			else
				Glee.selectedElement = LinkReaper.getNext();
            
			Glee.scrollToElement(Glee.selectedElement);

			// do not update subtext in case of inspect command
			if(Glee.commandMode && Glee.inspectMode)
				return;
			
			Glee.setSubText(Glee.selectedElement, "el");
		}
		
		// else if no element is selected, scroll through bookmarks
		else if(Glee.bookmarks.length != 0)
		{
			if(e.shiftKey)
				Glee.getPrevBookmark();
			else
				Glee.getNextBookmark();
		}
    },
    
    // called when a non-command query is entered by user
    queryNonCommand: function() {
        LinkReaper.unreapAllLinks();

		Glee.commandMode = false;

		// if a previous query's timer exists, reset it
		Glee.resetTimer();

		if(Glee.isDOMSearchRequired)
		{
		    // Set timer to search for links
			Glee.timer = setTimeout(function(){
				LinkReaper.reapLinks(Glee.searchField.attr('value'));
				Glee.selectedElement = LinkReaper.getFirst();
				Glee.setSubText(Glee.selectedElement,"el");
				Glee.scrollToElement(Glee.selectedElement);
				Glee.toggleActivity(0);
			}, 300);
		}
		else
		{
			Glee.setSubText(null, "el");
			Glee.toggleActivity(0);
		}
    },
    
    // when a scraper command is entered
    queryScraper: function(value) {
        var cmd = value.substr(1);
		var len = Glee.scrapers.length;
		
		for(var i=0; i<len; i++)
		{
			if(Glee.scrapers[i].command == cmd)
			{
				Glee.initScraper(Glee.scrapers[i]);
                return true;
			}
		}
		Glee.setSubText(null);
		return false;
    },
    
    // when a yubnub command is entered
    queryYubnub: function(value) {
        c = value.substring(1);
        c = c.replace("$", location.href);
        Glee.subText.html(Glee.Utils.filter("Run yubnub command (press enter to execute): " + c));
        Glee.URL = "http://yubnub.org/parser/parse?command=" + encodeURIComponent(c);
        Glee.subURL.html(Glee.Utils.filter(Glee.URL));
    },
    
    // when a page command is entered
    queryPageCmd: function(value) {
    	var trimVal = value.split(" ")[0].substr(1);
		Glee.URL = null;
		var len = Glee.commands.length;
		
		for(var i=0; i<len; i++)
		{
			if(trimVal == Glee.commands[i].name)
			{
				Glee.setSubText(Glee.commands[i].description,"msg");
				Glee.URL = Glee.commands[i];
				break;
			}
		}
        // If it is not a valid page command, try to find closest matching bookmarklet
		if(!Glee.URL)
		{
			Glee.Browser.getBookmarklet(trimVal);
		}
    },
    
    // when a page command is executed
    executePageCmd: function(e) {
		if(Glee.inspectMode)
		{
			Glee.inspectMode = false;
			result = Glee.inspectElement(Glee.selectedElement, 0);
			Glee.searchField.attr("value", result);
			Glee.setSubText("Now you can execute selector by adding * at the beginning or use !set vision=selector to add an esp vision for this page.", "msg");
			return true;
		}

		// TODO:Glee.URL is misleading here when it actually contains the command or bookmarklet. Fix this
		// If it a valid page command, execute it
		if(typeof(Glee.URL.name) != "undefined")
		{
		    if(e.shiftKey)
		        Glee.execCommand(Glee.URL, true);
			else
			    Glee.execCommand(Glee.URL, false);
			return;
		}
		// execute bookmarklet
		else
		{
			url = Glee.URL.url;
			var len = url.length;

			// Chrome hack: Replace occurences of window.open in bookmarklet JS so that it is not blocked as popup
			url = url.replace('window.open', 'Glee.Browser.openPageInNewTab');

			// Chrome hack: location.href = url doesn't work properly for all bookmarklets in Chrome
			if(url.substring(len - 3, len) == "();")
				location.href = url;
			else 
				eval(unescape(url.substring(11)));

			Glee.setSubText("Executing bookmarklet '" + Glee.URL.title + "'...","msg");

			setTimeout(function() {
				Glee.closeBox();
			}, 0);
		}
    },
    
    // jquery selector is executed
    executeJQuerySelector: function(value) {
        if(Glee.selectedElement)
			Glee.selectedElement.removeClass('GleeHL');
		
		LinkReaper.reapWhatever( value.substring(1) );
		Glee.selectedElement = LinkReaper.getFirst();
		Glee.setSubText(Glee.selectedElement, "el");
		Glee.scrollToElement(Glee.selectedElement);
		Glee.lastjQuery = value;
    },
    
    // general query execution 
    execute: function(e, value) {
        var anythingOnClick = true;

		// if is a yubnub command, add it to cache
		if(value[0] == ":")
		    Glee.addCommandToCache( value.split(" ")[0] );

		// If an element is selected
		if(Glee.selectedElement)
		{
			// Check to see if an anchor element is associated with the selected element
			var a_el = null;
			if (Glee.selectedElement[0].tagName == "A")
				a_el = Glee.selectedElement;
			else if (Glee.selectedElement[0].tagName == "IMG")
				a_el = Glee.selectedElement.parents('a');
			else
				a_el = Glee.selectedElement.find('a');

            // If an anchor is found, execute it
			if(a_el)
			{
				if(a_el.length != 0)
				{
					// If Shift is pressed, open in new tab
					if(e.shiftKey)
						target = true;
					else
						target = false;

					// Resetting target attribute of link so that it does not interfere with Shift behavior
					a_el.attr("target", "_self");

					// Simulating a click on the link
					anythingOnClick = Glee.Utils.simulateClick(a_el, target);

					// If opening link on the same page, close gleeBox
					if(!target)
					{
						setTimeout(function(){
							Glee.searchField.blur();
						}, 0);
						Glee.closeBoxWithoutBlur();
					}

					// If link is to be opened in a new tab & it isn't a scraper command, clear gleebox
					else if(Glee.searchField.attr('value').indexOf("?") == -1)
						Glee.searchField.attr('value', '');
                    
					return false;
				}
			}
		}

		if(Glee.URL == "#" || Glee.URL == "")
			Glee.URL = null;

		if(Glee.URL)
		{
			// If the URL is relative, make it absolute
			Glee.URL = Glee.Utils.makeURLAbsolute(Glee.URL, location.href);

			// Open in new tab
			if(e.shiftKey)
			{
				Glee.Browser.openNewTab(Glee.URL,false);
				// If it is not a scraper command, clear gleebox
				if(Glee.searchField.attr('value').indexOf("?") == -1)
					Glee.searchField.attr('value', '');
				return false;
			}
			else
			{
				url = Glee.URL;
				Glee.closeBoxWithoutBlur();
				window.location = url;
			}
		}
		else // If it is an input / textarea / button, set focus/click it, else bring back focus to document
		{
			if(Glee.selectedElement)
			{
				var el = Glee.selectedElement[0];
				if(el.tagName == "INPUT" && (el.type == "button" || el.type == "submit" || el.type == "image"))
				{
					setTimeout(function(){
						Glee.Utils.simulateClick(Glee.selectedElement,false);
					},0);
				}
				else if(el.tagName == "BUTTON")
				{
					setTimeout(function(){
						Glee.Utils.simulateClick(Glee.selectedElement,false);
						Glee.searchField.blur();
					},0);
				}
				else if(el.tagName == "INPUT" || el.tagName == "TEXTAREA")
				{
					setTimeout(function(){
						Glee.selectedElement[0].focus();
					},0);
				}
				else
				{
					setTimeout(function(){
						Glee.searchField.blur();
					},0);
				}
			}
			else
			{
				setTimeout(function(){
					Glee.searchField.blur();
				}, 0)
			}
		}
		
		setTimeout(function(){
			Glee.closeBoxWithoutBlur();
		}, 0);
    }
}