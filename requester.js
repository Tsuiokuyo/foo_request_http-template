if (typeof(MochiKit) == 'undefined' || typeof(MochiKit.Logging) == 'undefined') {
    this.log = Prototype.K;
    this.logError = Prototype.K;
    this.logDebug = Prototype.K;
    this.logFatal = Prototype.K;
    this.logWarning = Prototype.K;
}
/*---------------------------------------------------------------------------*/

Function.prototype.curry = function() {
    var args = arguments;
    var self = this;
    return function() {
        Array.prototype.unshift.apply(arguments, args);
        return self.apply(this, arguments);
    };
};

//some style can't set normal way. float..etc.
Element.setStyleText = function(element, styleText) {
    element.setAttribute('style', element.style.cssText + styleText);
};

Element.getStyleText = function(element, style) {
    return element.style.cssText.match(new RegExp('/' + style + ':\s*([^;]+)'))[1];
};

function __debug(str) {
    new Insertion.Bottom($('debug'), str + "</br>");
    $('debug').scrollTop = 99999;
};


var onloads = new Array();

function bodyOnLoad() {
    createLrcObj();
    for (var i = 0; i < onloads.length; i++)
        onloads[i]();
};


/*--------------------------------------------------------------------------*/


var TabContainer = Class.create();

TabContainer.prototype = {

    initialize: function(container, options) {
        this.setOptions(options);
        this.container = $(container);
        this.tabHeader = document.createElement("div");
        this.tabStrip = document.createElement("div");

        this.tabClose = document.createElement("div");
        this.tabs = new Array();
        this.lastExpandedTabs = new Array();

        if (this.container.hasChildNodes()) {
            this.tabHeader.id = 'tabheader';
            this.tabStrip.id = 'tabstrip';
            this.tabClose.id = 'tabclose';
            this.tabClose.appendChild(document.createTextNode(''));
            //Element.setStyleText(this.tabStrip, 'float:left;');
            //this.tabStrip.style.border = '1px solid red';
            //this.tabStrip.className = 'tab_title';
            //Element.setStyleText(this.tabClose, 'float:right;'); 
            Element.addClassName(this.tabClose, 'close');
            this.tabHeader.appendChild(this.tabStrip);
            this._setupCloseTab();
            this.tabHeader.appendChild(this.tabClose);
            this.tabHeader.appendChild(document.createElement("div"));

            this.container.insertBefore(this.tabHeader, this.container.firstChild);
            this._setupControl();

            this.showTab(this.tabs[0]);
        }
    },

    setOptions: function(options) {
        this.options = {
            margin: '3px 2px 0px 1px',
            padding: '1px 6px',
            borderColor: '#696',
            borderBottomColor: '#474',
            bgColor: '#474',
            textColor: '#ddd',
            textWeight: 'normal',
            activeTabBg: '#123',
            activeBg: '#123',
            activeTextColor: '#fff',
            activeTextWeight: 'bold',
            hoverBg: '#9c9',
            hoverTextColor: '#000',
            hoverTextWeight: 'normal',
            panelHeight: '',
            panelMinHeight: '200px',
            onHideTab: null,
            onShowTab: null
        }.extend(options || {});
    },

    showTab: function(tab) {
        if (this.visibleTab == tab) return;
        logDebug('showTab: ', tab.tabName);
        if (this.visibleTab) {
            if (this.options.onHideTab)
                this.options.onHideTab(this.lastExpandedTabs.last());
            this.visibleTab.hide();
        }
        if (this.options.onShowTab)
            this.options.onShowTab(tab);
        tab.show();
        if (this.visibleTab) {
            this.lastExpandedTabs = this.lastExpandedTabs.without(this.visibleTab);
            this.lastExpandedTabs.push(this.visibleTab);
            logDebug(this.visibleTab.tabName);
            this.lastExpandedTabs.each(function(v, idx) { logDebug(idx, v.tabName); });
        }
        this.visibleTab = tab;
    },

    addTab: function(tabElement, tabName) {
        children = this._childNodesByTag(tabElement, 'DIV');
        if (children.length != 2)
            return;

        tabElement.removeChild(children[0]);
        var tab = this._createTab(children[0], children[1], tabName || tabElement.id);
        this.container.appendChild(tabElement);
        //this.showTab(tab);
        return tab;
    },

    findTab: function(tabName) {
        for (var i = 0; i < this.tabs.length; ++i) {
            if (tabName == this.tabs[i].tabName)
                return this.tabs[i];
        }
        return null;
    },

    closeTab: function() {
        logDebug('closeTab: ', this.visibleTab.tabName);
        if (!this.visibleTab) return;
        if (this.visibleTab == this.tabs[0] //visible tab equals request tab
            &&
            this.tabs.length > 1) {
            this.showTab(this.lastExpandedTabs.pop());
        }
        var index = -1;
        for (var i = 1; i < this.tabs.length; ++i) {
            if (index != -1) {
                this.tabs[i - 1] = this.tabs[i];
            } else if (this.visibleTab == this.tabs[i]) {
                index = i;
            }
        }
        if (index == -1) return logError('Not found close tab. - ', this.visibleTab.tabName);;

        this.tabs.pop();

        this.tabStrip.removeChild(this.visibleTab.tab);
        this.container.removeChild(this.visibleTab.panel.parentNode);
        this.lastExpandedTabs.each(function(v, idx) { logDebug(idx, v.tabName); });
        this.lastExpandedTabs = this.lastExpandedTabs.without(this.visibleTab);
        var last = this.lastExpandedTabs.pop();
        this.visibleTab = null;
        if (last) this.showTab(last);
    },

    _createTab: function(tabTitleBar, tabContentBox, tabName) {
        //logDebug('_createTab: ', tabTitleBar, tabContentBox, tabName);
        this.tabStrip.appendChild(tabTitleBar);
        //tabTitleBar.style.zIndex = '2';

        //tabContentBox.style.zIndex = '-1';
        var tab = new TabContainer.Tab(this, tabTitleBar, tabContentBox, tabName)
        this.tabs.push(tab);
        return tab;
    },

    _setupControl: function() {
        var panels = this._childNodesByTag(this.container, 'DIV');
        for (var i = 0; i < panels.length; i++) {
            var tabChildren = this._childNodesByTag(panels[i], 'DIV');
            if (tabChildren.length != 2)
                continue;
            panels[i].removeChild(tabChildren[0]);
            this._createTab(tabChildren[0], tabChildren[1], panels[i].id);
        }
    },

    _childNodesByTag: function(e, tag) {
        var nodes = new Array();
        var childNodes = e.childNodes;
        for (var i = 0; i < childNodes.length; i++)
            if (childNodes[i] && childNodes[i].tagName && childNodes[i].tagName == tag)
                nodes.push(childNodes[i]);
        return nodes;
    },

    _setupCloseTab: function() {
        this.tabClose.className = 'close';
        this.tabClose.style.border = '1px solid ' + this.options.borderColor;
        this.tabClose.style.borderBottom = '';
        this.tabClose.style.margin = this.options.margin;
        this.tabClose.style.position = 'relative';
        this.tabClose.style.top = '1px';
        this.tabClose.style.padding = this.options.padding;
        this.tabClose.style.cssFloat = 'right';

        this.tabClose.onclick = this.closeTab.bindAsEventListener(this);
        var tabClose = this.tabClose;
        var options = this.options;
        this.tabClose.onmouseover = function() {
            tabClose.style.backgroundColor = options.bgColor;
        };
        this.tabClose.onmouseout = function() {
            tabClose.style.backgroundColor = '';
        };
        this.tabClose.onmousedown = function() {
            //tabClose.style.backgroundColor = options.hoverBg;
            tabClose.style.backgroundImage = 'url(/img/close6.gif)';
        };
        this.tabClose.onmouseup = function() {
            //tabClose.style.backgroundColor = options.bgColor;
            tabClose.style.backgroundImage = 'url(img/close2.gif)';
        };
    }
}

TabContainer.Tab = Class.create();

TabContainer.Tab.prototype = {

    initialize: function(tabContainer, tab, panel, tabName) {
        this.tabContainer = tabContainer;
        this.panel = panel;
        this.tab = tab;
        this.tabName = tabName || tab.innerHTML.stripTags();
        this.active = false;
        this.hide();
        this._setupControl();
    },

    hover: function(e) {
        if (!this.active) {
            var opts = this.tabContainer.options;
            this.tab.style.backgroundColor = opts.hoverBg;
            this.tab.style.color = opts.hoverTextColor;
            this.tab.style.fontWeight = opts.hoverTextWeight;
        }
    },

    unhover: function(e) {
        var opts = this.tabContainer.options;
        if (this.active) {
            this.tab.style.backgroundColor = opts.activeTabBg;
            this.tab.style.color = opts.activeTextColor;
            this.tab.style.fontWeight = opts.activeTextWeight;
        } else {
            this.tab.style.backgroundColor = opts.bgColor;
            this.tab.style.color = opts.textColor;
            this.tab.style.fontWeight = opts.textWeight;
        }
    },

    show: function(e) {
        var opts = this.tabContainer.options;
        this.tab.style.backgroundColor = opts.activeTabBg;
        this.tab.style.color = opts.activeTextColor;
        this.tab.style.fontWeight = opts.activeTextWeight;
        this.tab.style.borderBottomColor = opts.activeBg;
        this.tab.style.paddingBottom = '6px'
        this.tab.style.marginTop = '0px';
        // set the height in case the height option was changed since tab was setup
        this.panel.style.minHeight = opts.panelMinHeight;
        this.panel.style.height = opts.panelHeight;
        this.panel.style.display = 'block';
        this.active = true;
    },

    hide: function(e) {
        var opts = this.tabContainer.options;
        this.tab.style.backgroundColor = opts.bgColor;
        //this.tab.style.borderBottom = '';
        this.tab.style.color = opts.textColor;
        this.tab.style.fontWeight = opts.textWeight;
        this.tab.style.paddingBottom = '1px'
        this.tab.style.marginTop = '3px';
        this.tab.style.borderBottomColor = opts.borderColor;
        this.panel.style.display = 'none';
        //this.panel.style.overflow = "hidden";
        this.active = false;
    },

    tabClicked: function(e) {
        if (this.tabContainer.visibleTab == this)
            return;
        this.tabContainer.showTab(this);
    },

    _setupControl: function() {
        var opts = this.tabContainer.options;
        this.panel.style.color = opts.activeTextColor;
        this.panel.style.backgroundColor = opts.activeBg;
        this.panel.style.border = '1px solid ' + opts.borderColor;
        this.panel.style.clear = 'left';

        this.tab.style.border = '1px solid ' + opts.borderColor;
        //this.tab.style.borderBottom = '';
        this.tab.style.margin = opts.margin;
        this.tab.style.position = 'relative';
        this.tab.style.top = '2px';
        this.tab.style.padding = opts.padding;
        this.tab.style.whiteSpace = 'nowrap';

        //IE not work�Ashould be use className.
        //this.tab.style.cssFloat = 'left';
        //Element.setStyleText(this.tab, 'float:left;');

        this.tab.onclick = this.tabClicked.bindAsEventListener(this);
        this.tab.onmouseover = this.hover.bindAsEventListener(this);
        this.tab.onmouseout = this.unhover.bindAsEventListener(this);
    }
}


/*--------------------------------------------------------------------------*/
//google autocompleter

var Google = {};
Google.Autocompleter = Class.create();
Object.extend(Object.extend(Google.Autocompleter.prototype, Autocompleter.Base.prototype), {

    initialize: function(element, update, url, options) {
        options.onShow = options.onShow || function(element, update) {
            if (!update.style.position || update.style.position == 'absolute') {
                update.style.position = 'absolute';
                Position.clone(element, update, { setHeight: false, offsetTop: element.offsetHeight });
            }
            update.style.filter = "alpha(opacity:" + Math.round(0) + ")";
            update.style.opacity = 0; /*//*/ ;
            update.style.display = '';
            //new Rico.Effect.FadeTo( update, 1, 250, 5, {} );
            Effect.Appear(update, { duration: 0.15 });
        };
        this.baseInitialize(element, update, options);
        //this.options.asynchronous  = true;
        //this.options.onComplete    = this.onComplete.bind(this);
        this.options.defaultParams = this.options.parameters || null;
        this.url = url;
    },

    getUpdatedChoices: function() {
        entry = encodeURIComponent(this.options.paramName) + '=' +
            encodeURIComponent(this.getToken());

        this.options.parameters = this.options.callback ?
            this.options.callback(this.element, entry) : entry;

        if (this.options.defaultParams)
            this.options.parameters += '&' + this.options.defaultParams;

        //new Ajax.Request(this.url, this.options);
        var google_path = "http://www.google.co.jp/complete/search?hl=ja&js=true&qu=";
        var s = document.createElement('script');
        s.src = this.url + '?' + this.options.parameters;
        s.charset = 'UTF-8';
        document.body.appendChild(s);

    },

    sendRPCDone: function(n, input_str, suggest_array, count_array, f) {
        var buf = '<ul>';
        suggest_array.each(function(v) { buf += '<li>' + v + '</li>'; });
        buf += '</ul>';
        //alert(buf);
        this.updateChoices(buf);
        //alert(suggest_array.join(','));
        //this.updateChoices(suggest_array.join(','));
    },

    onComplete: function(request) {
        alert(request.responseText);
        eval('this.' + request.responseText);
    }

});

/*--------------------------------------------------------------------------*/
//message notify

var MessageFader = {
    fader: null,
    targetPlace: null,
    clear: function() {
        if (this.targetPlace) this.targetPlace.style.display = 'none';
    },
    fadeOut: function() {
        this.complete = this.clear;
        this.fader = new Rico.Effect.FadeTo(this.targetPlace, 0.0, 500, 10, this);

    },
    fadeWait: function() {
        this.complete = this.fadeOut;
        this.fader = new Rico.Effect.FadeTo(this.targetPlace, 1, 3000, 5, this);
    },
    fadeIn: function() {
        this.targetPlace.style.display = 'block';
        this.complete = this.fadeWait;
        this.fader = new Rico.Effect.FadeTo(this.targetPlace, 1, 250, 5, this);
    },
    fadeStart: function(msg) {
        if (this.targetPlace) {
            //			if(msg) 
            this.targetPlace.innerHTML = msg;
            if (this.fader && !this.fader.isFinished()) {

                this.complete = this.fadeIn;
                this.fader.steps = 0
            } else {
                this.fadeIn();
            }
        }
    },
    fade: function(target, msg) {
        if ($(target) != this.targetPlace) this.clear();
        this.targetPlace = $(target);
        this.fadeStart(msg);
    }
};
MessageFader.complete = MessageFader.fadeWait;

var FixedFader = {
    fader: MessageFader,
    targetPlace: null,
    fade: function(dummyTarget, msg) {
        if (msg && this.targetPlace) { this.fader.fade(this.targetPlace, msg); }
    },
    fadeOut: function() { if (this.targetPlace) this.fader.fadeOut(); },
    clear: function() { if (this.targetPlace) this.fader.clear(); }
};


function stripedElement(elems) {
    function resetClassName(element, from, to) {
        element.className = element.className.replace(RegExp(from), to).concat(' ').concat(to);
    }
    $A(elems).each(function(v, i) {
        i % 2 ? resetClassName(v, 'even_row', 'odd_row') : resetClassName(v, 'odd_row', 'even_row');
    });
}
/*        
function stripedElement(elems) {
  }
	for (var j = 1; j < elems.length; j += 2) {
		Element.removeClassName(elems[j], 'even_row');
		Element.addClassName(elems[j], 'odd_row');
	}
	for (var k = 0; k < elems.length; k += 2) {
		Element.removeClassName(elems[k], 'even_row');
		Element.addClassName(elems[k], 'odd_row');
	}
}
*/
/*--------------------------------------------------------------------------*/
var last_update_index_time = 0;
var update_index_time = 0;
var accordIndex = null;
var tabList = null;


ShowTimer = {
    nowTime_count: 0,
    stopAutoUpdate: false,
    playTime: null,
    endTime: null,
    lastAutoUpdateCount: 0,
    nowTimeCount: 0,
    playTimeField: null,
    nowProgressField: null,
    parseTime: function(time_str) {
        if (time_str.match(/(\d+):(\d+)/)) {
            var m = parseInt(RegExp.$1);
            var s = parseInt(RegExp.$2);
            return (m * 60 + s);
        } else {
            return null;
        }
    },
    /*buildTime: function( time_int ) {
      var s = String( time_int % 60 );
      if( s.length == 1 ) s = '0' + s;
      var m = String( Math.floor( time_int / 60 ) );
      return m.concat(':', s);
    },*/
    buildTime: function(time_int) {
        var s = String(Math.floor(time_int / 60));
        s += ':';
        var i = String(time_int % 60);
        while (i.length < 2) i = '0' + i;
        for (var j = 0; j < 2; ++j) s += i.charAt(j);
        return s;
    },
    resetTime: function() {
        logDebug('ShowTimer.resetTime');
        this.playTimeField = $('startTime');
        this.nowProgressField = $('nowProgress');
        var endTimeField = $('endTime');
        if (this.playTimeField != null && endTimeField != null) {
            this.playTime = this.parseTime(this.playTimeField.childNodes[0].data);
            this.endTime = (this.parseTime(endTimeField.childNodes[0].data) || this.endTime);
            this.nowProgressField.max = this.endTime;
            if (!this.playTime || !this.endTime) this.stopAutoUpdate = true;
        }
    },

    run: function() {
        this.nowTimeCount++;
        if (this.playTime == null) this.resetTime();
        if (this.playTime != null) {
            if (this.playTime >= this.endTime) {
                if (!this.stopAutoUpdate && this.lastAutoUpdateCount + 10 < this.nowTimeCount) {
                    this.lastAutoUpdateCount = this.nowTimeCount;
                    // ReqStatus.update();
                }
                ReqStatus.update();
                setTimeout(function() {
                    ReqStatus.update('', true);
                    // clearTimeout()
                }, 10000);

            } else {
                ++this.playTime;
                this.nowProgressField.value = this.playTime;
                this.playTimeField.childNodes[0].data = this.buildTime(this.playTime);
                dyLyric(this.playTime)
            }
        }
    }
}



/*--------------------------------------------------------------------------*/


//IE caching same request, so chenge request parameter
function avoidCache(params) {
    params = params + '&nowtime=' + (new Date).getTime();
    return params;
}


var SongList = {

    Cache: {

        cache: function() {},

        size: 0,

        formalize: function(key) {
            if (!key) key = ' ';
            key = key.replace(/&page=0/, '');
            key = key.replace(/&song_id=0/, '');
            return key;
        },

        get: function(key) {
            return this.cache[this.formalize(key)];
        },

        set: function(key, value) {
            if (!this.cache[this.formalize(key)])
                this.size++;
            this.cache[this.formalize(key)] = value;
        },

        clear: function() {
            this.cache = function() {};
            this.size = 0;
        }

    },

    updateFromFormElement: function(what, elem, isFocus) {
        SongList.updateTab('"' + $F(elem).slice(0, 20) + '"', Form.Element.serialize(elem), { isFocus: isFocus, tabIcon: what + 'Icon' });
        return false;
    },

    update: function(params, isFocus, isBackground) {
        SongList.updateTab('Song list', params, { isFocus: isFocus, isBackground: isBackground });
    },

    _update: function(fromPlace, toPlace, viewTab, scrollPlace, params) {
        MessageFader.fade('infoPlace', 'updating...');
		
		//params = decodeURI(params)
        var comp = new SongList.End(fromPlace, viewTab, scrollPlace, this.Cache, params);
        if (this.Cache.get(params)) {
            var p = $(toPlace);
            while (p.hasChildNodes()) p.removeChild(p.childNodes[0]);
            //$(toPlace).replaceChild($(toPlace).childNodes[0], this.Cache.get(params).cloneNode(true));
            p.appendChild(this.Cache.get(params).cloneNode(true));
            comp.run();
            return;
        }
        params = avoidCache(params);
        var myAjax = new Ajax.Updater(toPlace, '/ajax/songlist.html', { method: 'get', parameters: params, onComplete: comp.run.bind(comp), evalScripts: true });
    },

    updateTab: function(tabName, params, options) {
        options = options || {};
        var tab = tabList.findTab(tabName);
        if (!tab) {
            var newTab = document.createElement("div");

            //var title = $('floatLeftDiv').cloneNode(false); title.id = '';
            var title = document.createElement("div");
            //title.className = 'tab_title';
            var panel = document.createElement("div");
            Element.addClassName(title, 'tab_title');
            Element.addClassName(panel, 'tab_item');
            var ic = options.tabIcon ? $(options.tabIcon) : null;
            if (ic) {
                var newIc = ic.cloneNode(true);
                newIc.id = '';
                newIc.style.display = '';
                title.appendChild(newIc);
                title.appendChild(document.createTextNode(' '));
            }
            title.appendChild(document.createTextNode(tabName));
            panel.appendChild(document.createTextNode('Now loading...'));
            newTab.appendChild(title);
            newTab.appendChild(panel);
            tab = tabList.addTab(newTab, tabName);
        }

        SongList._update('songListTable', tab.panel,
            (!options.isBackground ? tab : null),
            (options.isFocus ? 'body' : null), params);
    },

    updateFromThis: function(element, params, isFocus, isBackground) {
        params = params.replace('_song_id=', '&song_id=')
        page = params.substring(params.lastIndexOf('=') + 1, params.length)
        maxView = document.getElementById("maxView").innerText
        params += '&page=' + page.replace(',', '') / maxView
        var p = element;
        for (; p != null; p = p.parentNode) {
            logDebug(p);
            if (Element.hasClassName(p, 'tab_item')) break;
        }
        if (p) {
            SongList._update('songListTable', p,
                //(!isBackground ? p.tab : null), 
                null,
                (isFocus ? 'status' : null), params);
        } else {
            SongList.updateTab('Song list', params, { isFocus: isFocus, isBackground: isBackground });
        }
    }

}


SongList.End = Class.create();

SongList.End.prototype = {

    initialize: function(fromPlace, viewTab, scrollPlace, cache, parameters, scrollTarget) {
        this.cache = cache;
        this.params = parameters;
        this.scrollPlace = scrollPlace;
        this.viewTab = viewTab;
        this.fromPlace = fromPlace;
    },

    run: function() {
        logDebug('SongList.End.run');
        if (this.scrollPlace) Element.scrollTo(this.scrollPlace);
        if (tabList && this.viewTab) tabList.showTab(this.viewTab);
        if ($(this.fromPlace)) {
            var node = $(this.fromPlace);
            stripedElement(node.getElementsByTagName('tbody')[0].getElementsByTagName('tr'));
            node.id = '';
            this.cache.set(this.params, node.cloneNode(true));
        }
        MessageFader.fadeOut();

    }
};


var ReqStatus = {

    updateFailure: function() {
        ShowTimer.stopAutoUpdate = true;
        var ins = new Insertion.After('updateStatus', " Auto updating failed!");
    },

    endUpdate: function() {
        update_index_time = parseInt($('updateIndexTime').innerHTML);
        if (last_update_index_time != update_index_time) {
            SongList.Cache.clear();
            last_update_index_time = update_index_time;
        }
        ShowTimer.playTime = null;
        $('serverStatusPlace').innerHTML = $('serverStatus').innerHTML;
        $('playListPlace').innerHTML = $('playList').innerHTML;
        var reqlist = $('requestList');
        stripedElement(reqlist.getElementsByTagName('tbody')[0].getElementsByTagName('tr'));
        var rl = $('requestListPlace');
        if (rl) rl.innerHTML = reqlist.innerHTML;
        var msg = $('message').innerHTML;
        if (msg) MessageFader.fade('messagePlace', msg);
        else MessageFader.fadeOut();
        //$('message').innerHTML = "";
    },

    endUpdateWithFocus: function() {
        ReqStatus.endUpdate();
        if (tabList) tabList.showTab(tabList.tabs[0]);
        Element.scrollTo('status');
    },

    update: function(params, isFocus) {
        ShowTimer.stopAutoUpdate = false;
        MessageFader.fade('infoPlace', 'updating...');
        var url = '/ajax/status.html';
        params = avoidCache(params);
        compFun = isFocus ? ReqStatus.endUpdateWithFocus : ReqStatus.endUpdate;
        var myAjax = new Ajax.Updater($('status'), url, {
            method: 'get',
            parameters: params,
            onComplete: compFun,
            onFailure: ReqStatus.updateFailure,
            evalScripts: true
        });
        createLrcObj();
    }
};

function updatePlace(place, url, params) {
    params = avoidCache(params);
    var myAjax = new Ajax.Updater(place, url, { method: 'get', parameters: params, evalScripts: true });
}


/*---------------------------------------------------------------------------*/


function setupAccord() {
    var accordOptions = {
        expandedBg: '#474',
        hoverBg: '#585',
        collapsedBg: '#363',
        expandedTextColor: '#ffffff',
        expandedFontWeight: 'bold',
        hoverTextColor: '#ffffff',
        collapsedTextColor: '#ced7ef',
        collapsedFontWeight: 'normal',
        hoverTextColor: '#ffffff',
        borderColor: '#696',
        panelHeight: 200,
        onHideTab: null,
        onShowTab: null,
        onLoadShowTab: 0,
        disableAnimate: true
    };

    function accord() {
        accordIndex = new Rico.Accordion('accordionIndex', accordOptions);

        function dynload(id, url, param) {
            var o = {
                last_update: 0,
                handle: function(e) {
                    if (this.last_update != update_index_time) {
                        this.last_update = update_index_time;
                        updatePlace(id, url, param);
                    }
                }
            };
            return o.handle.bind(o);
        }

        function reopen() {
            accordOptions.panelHeight = 200;
            accord.setOptions(accordOptions);
        }
        Event.observe('panel2Header', 'click', dynload('panel2Content', '/ajax/artist.html', ''), false);
        Event.observe('panel3Header', 'click', dynload('panel3Content', '/ajax/album.html', ''), false);
        Event.observe('panel4Header', 'click', dynload('panel4Content', '/ajax/genre.html', ''), false);
        Event.observe('panel5Header', 'click', dynload('panel5Content', '/ajax/date.html', ''), false);
    }

    onloads.push(accord);
}

/*---------------------------------------------------------------------------*/

function ieSpecific() {
    MessageFader = FixedFader;
    onloads.push(function() {
        MessageFader.targetPlace = $('fixedMessage');
        // $('fixed').style.height = '3em';
    });
}


function addRule(selector, declarations) {
    var sheets = document.styleSheets;

    if (sheets) {
        var tSheet = sheets[sheets.length - 1];

        if (document.all)
            tSheet.addRule(selector, declarations);

        else
            tSheet.insertRule(selector + "{" + declarations + "}", tSheet.cssRules.length);
    }
}



/*------*/



function parseTime(time_str) {
    if (time_str.match(/(\d+):(\d+)/)) {
        var m = parseInt(RegExp.$1);
        var s = parseInt(RegExp.$2);
        return (m * 60 + s);
    } else {
        return null;
    }
}

var lrcTime = []; //歌词对应的时间数组

function createLrcObj() {
    try {
        let lrc = document.getElementById("lyrics").innerHTML
        if (lrc == '?') {
            //document.getElementById("lyric").innerHTML = "<br /><li><p>查無動態歌詞 ∑(￣□￣;)</p></li>"
			//document.getElementById("lyric").innerHTML = "<br /><li><p>拔掉查詢動態歌詞 ∑(￣□￣;)</p></li>"
			document.getElementById("lyric").innerHTML = "<br /><li><p>自動查詢動態歌詞會極大影響淡出淡入，</p><p>因此先拔掉查詢動態歌詞 ∑(￣□￣;)</p></li>"
            return;
        }
        var oLRC = {
            ti: "", //歌曲名
            ar: "", //演唱者
            al: "", //专辑名
            by: "", //歌词制作人
            offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
            ms: [] //歌词数组{t:时间,c:歌词}
        };
        if (lrc.length == 0) return;
        var lrcs = lrc.replace(/\_(\d+:.+?)\_/g, '').split('__'); //QQ特殊格式移除，用回车拆分成数组
        if (lrcs.length <= 1) {
            lrcs = lrc.replace(/\_(\d+:.+?)\_/g, '').split('_');
        }
        if (lrcs.length <= 1) {
            lrcs = lrc.replace(/\_(\d+:.+?)\_/g, '').split('\n');
        }
        for (let i = 0; i < lrcs.length; i++) {
            lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
            var t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]")); //取[]间的内容
            var s = t.split(":"); //分离:前后文字
            if (isNaN(parseInt(s[0]))) { //不是数值
                // for (var i in oLRC) {
                for (let i = 0; i < oLRC.length; i++) {
                    if (i != "ms" && i == s[0].toLowerCase()) {
                        oLRC[i] = s[1];
                    }
                }
            } else { //是数值
                var arr = lrcs[i].match(/\[(\d+:.+?)\]/g); //提取时间字段，可能有多个
                var start = 0;
                //for (var k in arr) {
                for (let k = 0; k < arr.length; k++) {
                    start += arr[k].length; //计算歌词位置
                }
                var content = lrcs[i].substring(start); //获取歌词内容
                // for (var k in arr) {
                for (let k = 0; k < arr.length; k++) {
                    var t = arr[k].substring(1, arr[k].length - 1); //取[]间的内容
                    var s = t.split(":"); //分离:前后文字
                    oLRC.ms.push({ //对象{t:时间,c:歌词}加入ms数组
                        t: (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3),
                        c: content
                    });
                }
            }
        }
        oLRC.ms.sort(function(a, b) { //按时间顺序排序
            return a.t - b.t;
        });
        var ul = document.getElementById("lyric"); //获取ul
        var i = 0;
        oLRC.ms.forEach(function(key, value) { //遍历lrc
            lrcTime[i++] = key.t; //00:00.000转化为00.000格式
            ul.innerHTML += "<li><p>" + key.c + "</p></li>"; //ul里填充歌词
        });
    } catch (error) {}
}

function dyLyric(playTime) {
    try {
        if (document.getElementById("lyrics").innerHTML == '?') {
            if (document.getElementById("lyric").innerHTML.length == '34') return;
            //document.getElementById("lyric").innerHTML = "<br /><li><p>查無動態歌詞 ∑(￣□￣;)</p></li>"
			document.getElementById("lyric").innerHTML = "<br /><li><p>自動查詢動態歌詞會極大影響淡出淡入，</p><p>因此先拔掉查詢動態歌詞 ∑(￣□￣;)</p></li>"
            return;
        }

        var ul = document.getElementById("lyric");
        lrcTime[lrcTime.length] = lrcTime[lrcTime.length - 1] + 3; //如不另加一个结束时间，到最后歌词滚动不到最后一句
        var $li = document.getElementById('lyric').getElementsByTagName('li');
        if ($li.length == 0) {
            createLrcObj();
        }
        var currentLine = 0; //当前播放到哪一句了
        var currentTime; //当前播放的时间
        var ppxx; //保存ul的translateY值
        currentTime = playTime + 1.5; //串流延遲1.5秒
        for (j = currentLine, len = lrcTime.length; j < len; j++) {
            if (currentTime < lrcTime[j + 1] && currentTime > lrcTime[j]) {
                currentLine = j;
                ppxx = 40 - (currentLine * 32);
                ul.style.transform = "translateY(" + ppxx + "px)";
                $li[(currentLine - 1)].className = "";
                $li[(currentLine)].className = "on";
                break;
            }
        }
    } catch (error) {
        //  document.getElementById("lyric").innerHTML = "<li><p>查無動態歌詞∑(￣□￣;)</p></li>"
    }
}