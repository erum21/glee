// Saves options to clientside DB
function save_options(close_tab) {
	var prefs = {};
	var scrapers = [];
	var espModifiers = [];
	var disabledUrls = [];
	
	//saving the disabled URLs
	var domainNames = document.getElementsByClassName("domain-name");
	var d_len = domainNames.length;
	for(var i=0;i<d_len;i++)
	{
		disabledUrls[disabledUrls.length] = domainNames[i].innerHTML;
	}
	//Save search engine
	if(document.getElementsByName("glee_search")[0].value 
		&& document.getElementsByName("glee_search")[0].value != "")
		{
			search = document.getElementsByName("glee_search")[0].value;
		}
	else
		search = "http://www.google.com/search?q=";
	prefs.search_engine = search;
		
	//saving the gleeBox position
	if(document.getElementsByName("glee_pos")[0].checked) //top
		pos = 0;
	else if(document.getElementsByName("glee_pos")[1].checked) //middle
		pos = 1;
	else 	//bottom
		pos = 2;
	prefs.position = pos;
	
	//saving the gleeBox size
	if(document.getElementsByName("glee_size")[0].checked) //small
		size = 0;
	else if(document.getElementsByName("glee_size")[2].checked) //large
		size = 2;
	else 	//medium
		size = 1;
	prefs.size = size;

	//save theme
	tRadios = document.getElementsByName("glee_theme");
	for (var i=0; i < tRadios.length; i++)
	{
		if (tRadios[i].checked)
		{
 			prefs.theme = tRadios[i].value;
			theme = tRadios[i].value;
			break;
		}
	}
	
	//save hyper
	// if(document.getElementsByName("glee_hyper")[0].checked)
	// 	hyper = localStorage["glee_hyper"] = 1; //1 indicates enabled
	// else
	// 	hyper = localStorage["glee_hyper"] = 0;

	//saving bookmarks search option
	if(document.getElementsByName("glee_bookmark_search")[0].checked)
		bookmark_search = 1; //1 indicates enabled
	else
		bookmark_search = 0;

	prefs.bookmark_search = bookmark_search;
	
	//saving scrolling animation pref
	if(document.getElementsByName("glee_scrolling_animation")[0].checked)
		animation = 1; //enabled
	else
		animation = 0;

	prefs.scroll_animation = animation;

	//saving the custom scraper commands
	var scraperNames = document.getElementsByClassName("scraper-name");
	var scraperSels = document.getElementsByClassName("scraper-sel"); 
	var len = scraperNames.length;
	for(var i=0;i<len;i++)
	{
		var name = scraperNames[i].innerHTML;
		var sel = scraperSels[i].innerHTML;
		scrapers[scrapers.length] = { command:name, selector:sel, cssStyle:"GleeReaped", nullMessage: "Could not find any elements"};
	}
	
	//saving the ESP Status
	if(document.getElementsByName("glee_esp_status")[1].checked)
		espStatus = 0; //disabled
	else
		espStatus = 1;
 	prefs.esp_status = espStatus;

	//saving the ESP Modifiers

	var espUrls = document.getElementsByClassName("esp-url");
	var espSels = document.getElementsByClassName("esp-sel");
	var len = espUrls.length;
	for(var i=0;i<len;i++)
	{
		var url = espUrls[i].innerText;
		var sel = espSels[i].innerText;
		espModifiers[espModifiers.length] = { url:url, selector:sel };
	}
	saveAllPrefs(prefs,scrapers,disabledUrls,espModifiers,function(){
		prefs.scrapers = scrapers;
		prefs.disabledUrls = disabledUrls;
		prefs.espModifiers = espModifiers;
		propagateChanges(prefs);
		if(close_tab)
			closeOptions();
	});
}

function propagateChanges(prefs)
{
	chrome.windows.getAll({populate:true}, function(windows){
		for( i=0; i<windows.length; i++)
		{
			//set the status in all the tabs open in the window
			for(j=0;j<windows[i].tabs.length;j++)
			{
				chrome.tabs.sendRequest(windows[i].tabs[j].id, {value:"updateOptions", preferences:prefs},function(response){
				});
			}
		}
	});
	//update the global preferences cache
	chrome.extension.sendRequest({value:"updatePrefCache", preferences:prefs},function(){});
}

// Restores select box state to saved value from DB
function restore_options(prefs)
{
	initDefaultTexts();
	//getting the user defined restricted domains
	var len = prefs.disabledUrls.length;
	if(len != 0)
	{
		//parsing domainBuffer to get the domains
		var domainList = document.getElementById("domains");
		//TODO: use lastChild property here
		var lastChild = document.getElementById("addDomainLI");
		//displaying the domains in the restricted list
		for (var i=0; i<len; i++)
		{
			var newLI = document.createElement('li');
			var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeDomain("+i+")'/>";
			newLI.className = "rdomain";
			newLI.id = "rdomain"+i;
			newLI.innerHTML = "<span class='domain-name'>" + prefs.disabledUrls[i] + "</span>" + inputBt;
			domainList.insertBefore(newLI,lastChild);
		}
	}
	//getting the gleeBox position
	var pos = parseInt(prefs.position);
	if(pos != undefined)
		document.getElementsByName("glee_pos")[pos].checked = true;
	else
		document.getElementsByName("glee_pos")[1].checked = true;

	//getting the gleeBox size
	var size = parseInt(prefs.size);
	if(size != undefined)
		document.getElementsByName("glee_size")[size].checked = true;
	else
		document.getElementsByName("glee_size")[1].checked = true;

	//getting search engine
	var search = prefs.search_engine;
	document.getElementsByName("glee_search")[0].value = search;

	//getting theme
	var theme = prefs.theme;
	tRadios = document.getElementsByName("glee_theme");
	for (var i=0; i < tRadios.length; i++)
	{
		if (theme == tRadios[i].value)
		{
			tRadios[i].checked = true;
			break;
		}
	}
	// Getting HyperGlee
	// var hyper = localStorage["glee_hyper"];
	// hRadios = document.getElementsByName("glee_hyper");
	// if(hyper != null)
	// {
	// 	if(hyper == 1)
	// 		hRadios[0].checked = true;
	// 	else
	// 		hRadios[1].checked = true;
	// }
	// else
	// 	hRadios[1].checked = true;

	//getting the bookmark search status (enabled/disabled)
	var bookmark_status = prefs.bookmark_search;

	if(bookmark_status == 1)
		document.getElementsByName("glee_bookmark_search")[0].checked = true;
	else
		document.getElementsByName("glee_bookmark_search")[1].checked = true;

	//getting the scrolling animation pref
	var scroll_anim = prefs.scroll_animation;

	if(scroll_anim == 0)
		document.getElementsByName("glee_scrolling_animation")[1].checked = true;
	else
		document.getElementsByName("glee_scrolling_animation")[0].checked = true;

	//getting the custom scraper commands
	var len = prefs.scrapers.length;
	if(len != 0)
	{
		var scraperList = document.getElementById("scraper-commands");

		//last element is a string only containing a ,
		for (var i=0; i<len; i++)
		{
			var newLI = document.createElement('li');
			var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeScraper("+i+")'/>";
			newLI.className = "scraper";
			newLI.id = "scraper"+i;
			newLI.innerHTML = "<strong>?</strong><span class='scraper-name'>"+prefs.scrapers[i].command+"</span> : <span class='scraper-sel'>"+prefs.scrapers[i].selector+"</span>"+inputBt;
			scraperList.insertBefore(newLI,document.getElementById("addScraper"));
		}
	}	

	//getting ESP Status
	var espStatus = prefs.esp_status;

	if(espStatus == 0)
		document.getElementsByName("glee_esp_status")[1].checked = true;
	else
		document.getElementsByName("glee_esp_status")[0].checked = true; //default i.e. enabled
	
	//getting ESP Modifiers
	var espList = document.getElementById("esp-modifiers");
	var len = prefs.espModifiers.length;
	if(len != 0)
	{
		for (var i=0; i<len; i++)
		{
			var newLI = document.createElement('li');
			var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeEspModifier("+i+")'/>";
			newLI.className = "esp";
			newLI.id = "esp"+i;
			newLI.innerHTML = "<span class='esp-url'>"+prefs.espModifiers[i].url+"</span> : <span class='esp-sel'>"+prefs.espModifiers[i].selector+"</span>"+inputBt;
			espList.insertBefore(newLI,document.getElementById("addEspModifier"));
		}
	}
	else
	{
		//adding a couple of default examples
		var newLI = document.createElement('li');
		var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeEspModifier(0)'/>";
		newLI.className = "esp";
		newLI.id = "esp0";
		newLI.innerHTML = "<span class='esp-url'>google.com/search</span> : <span class='esp-sel'>h3:not(ol.nobr>li>h3)</span>"+inputBt;
		espList.insertBefore(newLI,document.getElementById("addEspModifier"));

		var newLI_2 = document.createElement('li');
		var inputBt_2 = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeEspModifier(1)'/>";
		newLI_2.className = "esp";
		newLI_2.id = "esp1";
		newLI_2.innerHTML = "<span class='esp-url'>bing.com/search</span> : <span class='esp-sel'>div.sb_tlst</span>"+inputBt_2;
		espList.insertBefore(newLI_2,document.getElementById("addEspModifier"));
	}
	makeItemsEditable();
}

function makeItemsEditable(){
	//click handler
	function clickHandler(e){
		e.stopPropagation();
		var editableField = document.getElementById("temporary-edit-field");
		if(e.target != editableField)
		{
			if(editableField)
			{
				var val = editableField.value;
				var parent = editableField.parentNode;
				parent.removeChild(editableField);
				parent.className = parent.className.slice(0, parent.className.length - 2);
				parent.innerHTML = val;
			}
			var textField = document.createElement("input");
			textField.type = "text";
			textField.value = this.innerHTML;
			textField.id = "temporary-edit-field";
			this.innerHTML = "";
			//invalidate the class name to avoid CSS
			this.className += "##";
			this.appendChild(textField);
			textField.focus();
			textField.addEventListener("keydown",function(e){
				if(e.keyCode == 13 || e.keyCode == 27)
				{
					var parent = this.parentNode;
					var val = textField.value;
					parent.className = parent.className.slice(0, parent.className.length - 2);
					parent.removeChild(this);
					parent.innerHTML = val;
				}
			},false);
			return false;
		}
	}
	
	//make domains editable
	var domainNames = document.getElementsByClassName("domain-name");
	var len = domainNames.length;
	for(var i=0; i<len; i++)
	{
		domainNames[i].addEventListener(
		"click",
		clickHandler,
		false
		);
	}
	
	//make scrapers editable
	var scraperNames = document.getElementsByClassName("scraper-name");
	var scraperSels = document.getElementsByClassName("scraper-sel");
	len = scraperNames.length;
	for(var i=0; i<len; i++)
	{
		scraperNames[i].addEventListener(
		"click",
		clickHandler,
		false
		);
		scraperSels[i].addEventListener(
		"click",
		clickHandler,
		false
		);
	}
	
	//make visions editable
	var espUrls = document.getElementsByClassName("esp-url");
	var espSels = document.getElementsByClassName("esp-sel");
	len = espUrls.length;
	for(var i=0; i<len; i++)
	{
		espUrls[i].addEventListener(
		"click",
		clickHandler,
		false
		);
		espSels[i].addEventListener(
		"click",
		clickHandler,
		false
		);
	}
	
	//add event listener to document to remove editable field (if it exists)
	document.addEventListener(
		"click",
		function(e){
			var editableField = document.getElementById("temporary-edit-field");
			if(editableField && e.target != editableField)
			{
				var val = editableField.value;
				var parent = editableField.parentNode;
				parent.removeChild(editableField);
				parent.className = parent.className.slice(0, parent.className.length - 2);
				parent.innerHTML = val;
			}
		}, 
		false);
}

//Adds a domain to the restricted domain list
function addDomain() {
	var newDomain = document.getElementById("add_domain");
	var lastChild = document.getElementById("addDomainLI");
	//TODO: create a validate() method with more strict validation
	if(newDomain.value != "")
	{
		var domainList = document.getElementById("domains");
		var newLI = document.createElement('li');
		var no = domainList.children.length+1;
		var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeDomain("+no+")'/>";
		newLI.className = "rdomain";
		newLI.id = "rdomain"+no;
		newLI.innerHTML = "<span class='domain-name'>" + newDomain.value + "</span>" + inputBt;
		domainList.insertBefore(newLI,lastChild);
		newDomain.value = "";
	}
}

function removeDomain(i){
	var el = document.getElementById("rdomain"+i);
	var domainList = document.getElementById("domains");
	domainList.removeChild(el);
	//remove the domain from the list

	return 0;
}

function addScraper(){
	var scraperName = document.getElementById("scraper-name");
	var scraperSel = document.getElementById("scraper-selector");

	if(validateScraper(scraperName.value,scraperSel.value))
	{
		var scraperList = document.getElementById("scraper-commands");
		var newLI = document.createElement("li");
		var no = scraperList.children.length+1;
		newLI.className = "scraper";
		newLI.id = "scraper"+no;
		var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeScraper("+no+")'/>";
		newLI.innerHTML = "<strong>?</strong><span class='scraper-name'>"+scraperName.value+"</span> : <span class='scraper-sel'>"+scraperSel.value+"</span>"+inputBt;
		scraperList.insertBefore(newLI,document.getElementById("addScraper"));
		scraperName.value="";
		scraperSel.value="";
	}
}

function removeScraper(i){
	var el = document.getElementById("scraper"+i);
	var scraperList = document.getElementById("scraper-commands");
	scraperList.removeChild(el);
	//remove the domain from the list
	return 0;
}

function validateScraper(name,selector)
{
	//check that command name/selector should not be blank
	if(name == "" || selector == "" || name == "Name" || selector == "jQuery Selector")
		return false;
	//check that command name does not conflict with the default scraper command names
	if(name == "h" || name == "?" || name == "img" || name == "a")
		return false;
	if(name.indexOf('`')!=-1 || selector.indexOf('`')!= -1)
		return false;
	return true;
}

function addEspModifier(){
	var espURL = document.getElementById("add-esp-url");
	var espSel = document.getElementById("add-esp-selector");
	
	if(validateEspModifier(espURL.value,espSel.value))
	{
		var espList = document.getElementById("esp-modifiers");
		var newLI = document.createElement("li");
		var no = espList.children.length+1;
		newLI.className = "esp";
		newLI.id = "esp"+no;
		var inputBt = "<input class='button' style='float:right' type='button' value='Remove' onclick='removeEspModifier("+no+")'/>";
		newLI.innerHTML = "<span class='esp-url'>"+espURL.value+"</span> : <span class='esp-sel'>"+espSel.value+"</span>"+inputBt;
		espList.insertBefore(newLI,document.getElementById("addEspModifier"));
		espURL.value="";
		espSel.value="";
	}
}

function removeEspModifier(i){
	var el = document.getElementById("esp"+i);
	var espList = document.getElementById("esp-modifiers");
	espList.removeChild(el);
	return 0;
}

function validateEspModifier(name,selector)
{
	//check that name/selector should not be blank
	if(name == "" || selector == "" || name == "Page URL" || selector == "jQuery Selector")
		return false;
	return true;
}

function closeOptions(text){
	chrome.tabs.getSelected(null, function(tab){
		chrome.tabs.remove(tab.id, function(){});
	});
}

function clearDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;
    
    if (target.value == target.defaultText) {
        target.value = '';
    }
}

function replaceDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;
    
    if (target.value == '' && target.defaultText) {
        target.value = target.defaultText;
    }
}

function initDefaultTexts() {
    var formInputs = document.getElementsByTagName('input');
    for (var i = 0; i < formInputs.length; i++) {
        var theInput = formInputs[i];
        
        if (theInput.type == 'text') {
            /* Add event handlers */
            theInput.addEventListener('focus', clearDefaultText, false);
            theInput.addEventListener('blur', replaceDefaultText, false);
            /* Save the current value */
            if (theInput.value != '') {
                theInput.defaultText = theInput.value;
            }
        }
	}
}	