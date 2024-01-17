/*
 * Ext JS Library 1.1.1
 * Copyright(c) 2006-2007, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://www.extjs.com/license
 */
Ext.BLANK_IMAGE_URL = 'ext/resources/images/default/s.gif';

Ext.example = function(){
	var msgCt;

	function createBox(t, s){
		return ['<div class="msg" style="">',
				'<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
				'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
				'<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
				'</div>'].join('');
	}
	return {
		msg : function(title, format){
			if(!msgCt){
				msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
			}
			msgCt.alignTo(document, 't-t');
			var s = String.format.apply(String, Array.prototype.slice.call(arguments, 1));
			var m = Ext.DomHelper.append(msgCt, {html:createBox(title, s)}, true);
			m.slideIn('t').pause(5).ghost("t", {remove:true});
		},

		init : function(){
			var s = Ext.get('extlib'), t = Ext.get('exttheme');
			if(!s || !t){ // run locally?
				return;
			}
			var lib = Cookies.get('extlib') || 'ext', 
				theme = Cookies.get('exttheme') || 'aero';
			if(lib){
				s.dom.value = lib;
			}
			if(theme){
				t.dom.value = theme;
				Ext.get(document.body).addClass('x-'+theme);
			}
			s.on('change', function(){
				Cookies.set('extlib', s.getValue());
				setTimeout(function(){
					window.location.reload();
				}, 250);
			});

			t.on('change', function(){
				Cookies.set('exttheme', t.getValue());
				setTimeout(function(){
					window.location.reload();
				}, 250);
			});
		}
	};
}();

Ext.onReady(Ext.example.init, Ext.example);


// old school cookie functions grabbed off the web
var Cookies = {};
Cookies.set = function(name, value){
	 var argv = arguments;
	 var argc = arguments.length;
	 var expires = (argc > 2) ? argv[2] : null;
	 var path = (argc > 3) ? argv[3] : '/';
	 var domain = (argc > 4) ? argv[4] : null;
	 var secure = (argc > 5) ? argv[5] : false;
	 document.cookie = name + "=" + escape (value) +
	   ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) +
	   ((path == null) ? "" : ("; path=" + path)) +
	   ((domain == null) ? "" : ("; domain=" + domain)) +
	   ((secure == true) ? "; secure" : "");
};

Cookies.get = function(name){
	var arg = name + "=";
	var alen = arg.length;
	var clen = document.cookie.length;
	var i = 0;
	var j = 0;
	while(i < clen){
		j = i + alen;
		if (document.cookie.substring(i, j) == arg)
			return Cookies.getCookieVal(j);
		i = document.cookie.indexOf(" ", i) + 1;
		if(i == 0)
			break;
	}
	return null;
};

Cookies.clear = function(name) {
  if(Cookies.get(name)){
	document.cookie = name + "=" +
	"; expires=Thu, 01-Jan-70 00:00:01 GMT";
  }
};

Cookies.getCookieVal = function(offset){
   var endstr = document.cookie.indexOf(";", offset);
   if(endstr == -1){
	   endstr = document.cookie.length;
   }
   return unescape(document.cookie.substring(offset, endstr));
};



var RequestlistGrid = {
	ds: null, 
	cm: null, 
	grid: null,
	
	init: function(gridId) {
		this.ds = new Ext.data.Store({

			proxy: new Ext.data.HttpProxy({url: '/json/requestlist.json', method: 'GET'}),

			reader: new Ext.data.JsonReader({
				   root: 'songlist'
			   }, [
			 	   { name:'list_id', mapping:'list_id'},
			 	   { name:'song_id', mapping:'song_id'},
				   { name:'artist', mapping:'artist'}, 
				   { name:'album', mapping:'album'},
				   	'title',
					'length',
					'codec',
					'index',
					'priority',
					'is_requested'
			   ])
		});
	   	
	   	this.ds.on('load', function(ds, records, options){
	   		// remove last empty ojbect.
	   		ds.remove(ds.getAt(ds.getCount() - 1));
	   	});

		function renderRequest(value, p, record, i, j, ds){
			if (value == 1) {
				return 'Requested';
			} else {
				return '';
			}
			return String.format('<b>{0}</b>{1}', value, record.get['list_id'], record.get['song_id']);
		}
		
		this.cm = new Ext.grid.ColumnModel([
			{header: "index", width: 30, dataIndex: 'index'},
			{header: "Priority", width: 40, dataIndex: 'priority'},
			{header: "Artist", width: 110, dataIndex: 'artist'},
			{header: "Title", width: 110, dataIndex: 'title'},
			{header: "Album", width: 110, dataIndex: 'album', hidden:true },
			{header: "length", width: 45, dataIndex: 'length'},
			{header: 'Status', width: 50, dataIndex: 'is_requested', renderer: renderRequest },
			{header: "Codec", width: 50, dataIndex: 'codec', hidden:true }
		]);
		this.cm.defaultSortable = true;

		this.grid = new Ext.grid.Grid(gridId, {
			ds: this.ds,
			cm: this.cm
		});

		this.grid.render();

		var gridFoot = this.grid.getView().getFooterPanel(true);
		var fm = new Ext.form.Form({handler:function(){}});
		var reqB = fm.addButton('Request');
		var canB = fm.addButton('Cancel');
		//var downB = fm.addButton('Download');
		fm.render(gridFoot);
		reqB.disable();
		canB.disable();
		//downB.disable();
		var grid = this.grid;
		reqB.on('click', function(){
				var record = grid.getSelectionModel().getSelected();
				var l = record.get('list_id');
				var s = record.get('song_id');
				Requester.request(l, s);
		});
		canB.on('click', function(){
				var record = grid.getSelectionModel().getSelected();
				var l = record.get('list_id');
				var s = record.get('song_id');
				Requester.cancel(l, s);
		});
		//downB.on('click', function(){
		//		var record = grid.getSelectionModel().getSelected();
		//		var l = record.get('list_id');
		//		var s = record.get('song_id');
		//		var a = record.get('artist');
		//		var t = record.get('title');
		//		window.open('/download/' + a + ' - ' +  t + '?list_id=' + l + '&song_id=' + s);
		//});
		
		this.grid.on('rowClick', function(grid, number, e){
			var b = grid.getDataSource().getAt(number).get('is_requested');
			if (b == 1){
				canB.enable();
				reqB.disable();
			}else{
				reqB.enable();
				canB.disable();
			}
			var artist = grid.getDataSource().getAt(number).get('artist');
			var title = grid.getDataSource().getAt(number).get('title');
			var album = grid.getDataSource().getAt(number).get('album');
			var list_id = grid.getDataSource().getAt(number).get('list_id');
			var song_id = grid.getDataSource().getAt(number).get('song_id');
			JacketImageView.update(list_id, song_id, artist, title, album);
		});
		this.ds.load();
		
		return this.grid;
	},
		
	update: function() {
		this.ds.reload();
	}
}


var Requester = function(){
	function command(name, list_id, song_id) {
		var ajax = Ext.lib.Ajax.request(
			'GET',
			'/json/info.json?cmd='+name+'&list_id=' + list_id + '&song_id=' + song_id,
			{
				success: function (res, args) {
					var text = res.responseText;
					Ext.example.msg('Connect success', "<br /> <b>{0}</b>", Ext.decode(text).message);
					//Ext.example.msg('Request success', "You requested {0}, {1}<br /> <b>{2}</b>", list_id, song_id, Ext.decode(text).message);
					RequestlistGrid.update();
				},
				failure: function (res, args) {
					var text = res.responseText;
					Ext.example.msg('Connect failure', '');
				}
			});
	}
	return {
		request: function(list_id, song_id){
			command('request', list_id, song_id);
		},
			
		cancel: function(list_id, song_id){
			command('remove', list_id, song_id);
		}
	}
}();

var SonglistDialog = function(){
	// everything in this space is private and only accessible in the HelloWorld block
	
	/*  songlist grid  */
	function createPlaylistGrid(param, content){
		
		// create the Data Store
		var ds = new Ext.data.Store({
			// load using script tags for cross domain, if the data in on the same domain as
			// this page, an HttpProxy would be better
			proxy: new Ext.data.HttpProxy({
				url: '/json/songlist.json?' + param,
				method: 'GET'
			}),

			// create reader that reads the Topic records
			reader: new Ext.data.JsonReader({
				root: 'songlist',
				totalProperty: 'total_size'
				//id: 'post_id'
			}, [
				{name: 'list_id', mapping: 'list_id'},
				{name: 'song_id', mapping: 'song_id'},
				{name: 'title', mapping: 'title'},
				{name: 'artist', mapping: 'artist'},
				{name: 'album', mapping: 'album'},
				{name: 'comment', mapping: 'comment'},
				{name: 'length', mapping: 'length'},
				'codec',
				'bitrate',
				'filename_ext'
			])

			// turn on remote sorting
			//remoteSort: true
		});

		ds.on('load', function(ds, records, options){
	   		// remove last empty ojbect.
	   		ds.remove(ds.getAt(ds.getCount() - 1));
	   	});

		// pluggable renders
		function renderTopic(value, p, record){
			return String.format('<b>{0}</b>{1}', value, record.data['excerpt']);
		}
		function renderTopicPlain(value){
			return String.format('<b><i>{0}</i></b>', value);
		}
		function renderLast(value, p, r){
			return String.format('{0}<br/>by {1}', value.dateFormat('M j, Y, g:i a'), r.data['author']);
		}
		function renderLastPlain(value){
			return value.dateFormat('M j, Y, g:i a');
		}
		var artistId=Ext.id(), titleId=Ext.id(), albumId=Ext.id(), commentId=Ext.id(), lengthId=Ext.id(), codecId=Ext.id(), bitrateId=Ext.id();
		// the column model has information about grid columns
		// dataIndex maps the column to the specific data field in
		// the data store
		var cm = new Ext.grid.ColumnModel([{
				id: artistId,
				header: "Artist",
				dataIndex: 'artist',
				width: 200,
				hidden: false
			},{
				id: titleId, // id assigned so we can apply custom css (e.g. .x-grid-col-topic b { color:#333 })
				header: "Title",
				dataIndex: 'title',
				width: 200,
				css: 'white-space:normal;'
			},{
				id: albumId,
				header: "Album",
				dataIndex: 'album',
				width: 200,
				hidden: true
			},{
				id: commentId,
				header: "comment",
				dataIndex: 'comment',
				width: 150
			},{
				id: lengthId,
				header: "length",
				dataIndex: 'length',
				width: 60,
				hidden: false
			},{
				id: codecId,
				header: "codec",
				dataIndex: 'codec',
				width: 60,
				hidden: true
			},{
				id: bitrateId,
				header: "bitrate",
				dataIndex: 'bitrate',
				width: 60,
				hidden: true
			}]);

		

		// create the grid
		var grid = new Ext.grid.Grid(content, {
			ds: ds,
			cm: cm,
			selModel: new Ext.grid.RowSelectionModel({singleSelect:true}),
			enableColLock:false,
			loadMask: true
		});
		

		// render it
		grid.render();

		var gridFoot = grid.getView().getFooterPanel(true);

		// add a paging toolbar to the grid's footer
		var paging = new Ext.PagingToolbar(gridFoot, ds, {
			pageSize: 100,
			displayInfo: true,
			displayMsg: 'Displaying songs {0} - {1} of {2}',
			emptyMsg: "No songs to display"
		});
		// add the detailed view button
		paging.add('-', {
			pressed: false,
			enableToggle:true,
			text: 'Detailed View',
			cls: 'x-btn-text-icon details',
			toggleHandler: toggleDetails
		});
		
		// trigger the data store load
		ds.load({params:{start:0, limit:100}});

		function toggleDetails(btn, pressed){
			cm.setHidden(cm.getIndexById(albumId), !pressed ? true : false);
			cm.setHidden(cm.getIndexById(codecId), !pressed ? true : false);
			cm.setHidden(cm.getIndexById(bitrateId), !pressed ? true : false);
			
		//	cm.getColumnById('topic').renderer = pressed ? renderTopic : renderTopicPlain;
		//	cm.getColumnById('last').renderer = pressed ? renderLast : renderLastPlain;
		//	grid.getView().refresh();
		}
		
		return grid;
	}
	
	// define some private variables
	var dialogList = [];
	var gridList = [];
	var pos = 0;
	var dialog;
	var defWidth = 650;
	var defHeight = 400;
	
	// return a public interface
	return {
		init : function(){
			 showBtn = Ext.get('show-dialog-btn');
			 // attach to click event
			 //showBtn.on('click', this.showDialog, this);
		},
	   
		create : function(param, title, gridId, from){
			
			for (var i = 0; i < dialogList.length; ++i){
				if(dialogList[i].id == gridId){
					// activate dialog.
					dialogList[i].show(from.dom);
					return dialogList[i];
				}
			}
			var dialog;
			var grid;

			pos = pos % 200 + 20;
			dialog = new Ext.BasicDialog(gridId, { 
					autoCreate: true,
					//autoTabs:true,
					width:defWidth,
					height:defHeight,
					shadow:true,
					minWidth:200,
					minHeight:150,
					proxyDrag: true,
					title:title,
					x:pos,
					y:pos
			});
			dialog.addKeyListener(27, dialog.hide, dialog);
			var reqButton = dialog.addButton('Request', function(){
				var record = grid.getSelectionModel().getSelected();
				var l = record.get('list_id');
				var s = record.get('song_id');
				Requester.request(l, s);
			})
			reqButton.disable();
			var downButton;
			if (CurrentStatus.isEnableDownloadInPlaylist()) {
				downButton = dialog.addButton('Download', function(){
					var record = grid.getSelectionModel().getSelected();
					var l = record.get('list_id');
					var s = record.get('song_id');
					var f = record.get('filename_ext');
					window.open('/download/' + f + '?list_id=' + l + '&song_id=' + s);
				});
				downButton.disable();
			}
			dialog.addButton('Close', dialog.hide, dialog);
			
			
			dialog.on('resize', function(o, w, h){
				if (w > 300) {defWidth = w;}
				if (h > 200) {defHeight = h;}
			});

			dialog.on('show', function(){
				grid = createPlaylistGrid(param, dialog.body);
				grid.on('rowClick', function(){ 
						reqButton.enable(); 
						
						if (downButton && CurrentStatus.isEnableDownloadInPlaylist()) {
							downButton.enable(); 
						}
					}, this, { single:true });
				grid.on('rowDblClick', function(grid, number, e){
					var r = grid.getDataSource().getAt(number);
					var l = r.get('list_id');
					var s = r.get('song_id');
					Requester.request(l, s);
				});
				dialog.on('resize', grid.autoSize, grid);
				dialogList.push(dialog);
				gridList.push(grid);
			}, { single:true });
			dialog.show(from.dom);
			
			
		},
			
		hideAll: function() {
			for (var i = 0; i < dialogList.length; ++i){
				dialogList[i].hide();
			}
		}
		
	};
}();


var ListTab = function(){
	/*  indexlist grid  */
	function createIndexlistGrid(name, gridId){
		var idKey = name + '_id';
		
		ds = new Ext.data.Store({
			proxy: new Ext.data.HttpProxy({url: '/json/'+ name +'list.json?' + name + '_id=__list_size'}), // name + id=__list_size is needed for tatal_size info.
			reader: new Ext.data.JsonReader({
				   root: name + 'list',
			   	   totalProperty: 'total_size'
			   }, [
					name,
					idKey,
					'song_num'
			   ])
		});

		ds.on('load', function(ds, records, options){
	   		// remove last empty ojbect.
	   		ds.remove(ds.getAt(ds.getCount() - 1));
	   	});

		cm = new Ext.grid.ColumnModel([
			{header: "Name", width: 170, dataIndex: name},
			{header: "Size", width: 45, dataIndex: 'song_num', type:'int'}
		]);
		cm.defaultSortable = true;

		grid = new Ext.grid.Grid(gridId, {
			ds: ds,
			cm: cm
		});
		grid.on('rowclick', function(grid, rowIndex, e){
			var row = grid.getDataSource().getAt(rowIndex);
			var id = row.get(idKey);
			var listName = row.get(name);
			var gridId = "plGrid" + idKey + rowIndex;
			SonglistDialog.create(idKey + '=' + encodeURIComponent(id), listName, gridId, grid.getGridEl());
		});
		grid.render();
		
/*		
		var gridFoot = grid.getView().getFooterPanel(true);
		var paging = new Ext.PagingToolbar(gridFoot, ds, {
			pageSize: 500//,
			//displayInfo: true,
			//displayMsg: 'Displaying {0} - {1} of {2}',
			//emptyMsg: "No items to display"
		});		
		
		ds.load({params:{start:0, limit:500}});
*/		
		ds.load();
		return grid;
		
	}
	
	var tablist = [];
	var rz;
	var grids = [];
	//var gridHeight = 265;
	
	return {
		
		init: function(){
			tabs = new Ext.TabPanel('list-tab-panel', {
				resizeTabs: true, // turn on tab resizing
				minTabWidth: 22,
				preferredTabWidth: 150
			});
			//tabs.resizeTabs = true;
/*
			rz = new Ext.Resizable('list-tab-panel', {
				wrap:true,
				minHeight:100,
				minWidth:100,
				pinned:true,
				handles: 's'
			});
			rz.on('resize', tabs.autoSizeTabs, tabs);
//			rz.on('resize', function(a, w, h){ 
//				gridHeight = h;
//				for (var i = 0; i < tablist.length; ++i) {
//					var tab = tablist[i];
//					tab.bodyEl.setHeight(h);
//				}
//			});
*/
			this.addIndexlist('list');
			this.addIndexlist('artist');
			this.addIndexlist('album');
			this.addIndexlist('genre');
			this.addIndexlist('date');
			
			tabs.activate(0);

		},
		
		addGridTab: function(id, name, gridId){
			var tabItem = tabs.addTab(
				id,
				name,
				'<div id="' + gridId + '" class="list-tab-grid"></div>',
				false
			);
			return tabItem;
		},
		
		addIndexlist: function(name)
		{
			var tab = this.addGridTab(name+'list', name+'s', name+'grid');
			tablist.push(tab);
			tab.on('activate', function(tabPanel, tabItem){
				var g = createIndexlistGrid(name, name+'grid');
				grids.push(g);
				tab._grid = g;
				ListTab.resizeGridWith(g);

				tabItem._grid.getDataSource().reload();
			}, null, { single:true });
			
		},
		
		update: function(){
			for(var i = 0; i < grids.length; ++i){
				grids[i].getDataSource().reload();
			}
		},
		
		
		resizeGridWith: function(grid){
			// grid Element need size in tabPanel.
/*
			rz.on('resize', function(o, w, h){
				grid.getGridEl().setSize(w, h - 35);
				grid.autoSize();
			});
*/
		},

		
		getRz: function(){return rz;}
		
	}
}();

var CurrentStatus = function(){
	
	var updateInterval = 10;
	var play_time = null;
	var end_time = null;
	var interval_id = null;
	var play_time_field = null;
	var lastUpdate = 0;
	var enableDownloadInPlaylist = false;
	var enableDownloadInUpload = false;
	var enableDownloadInHistory = false;
	
	function reset() {
		window.clearInterval(interval_id);
		play_time = null;
		end_time = null;
		play_time_field = null;
		interval_id = null;
	}
	function parseTime( time_str ){
		time_str.match(/(\d+):(\d+)/);
		var m = parseInt(RegExp.$1);
		var s = parseInt(RegExp.$2);
		return ( m * 60 + s );
	}
	
	function showTime() {
		
		if( play_time == null ) 
		{
			play_time_field = document.getElementById('start_time');
			var v2 = document.getElementById('end_time');
			if( play_time_field == null || v2 == null )
			{
				reset();
				return;
			}
			play_time = parseTime( play_time_field.innerHTML );
			end_time = parseTime( v2.innerHTML );
			++play_time;
		}
		if( play_time != null ) {

			play_time += updateInterval;
			var s = String( play_time % 60 );
			if( s.length == 1 ) s = "0" + s;
			var m = String( Math.floor( play_time / 60 ) );
			play_time_field.innerHTML = m.concat(":", s);
			
			if( play_time >= end_time ) {
				reset();
				CurrentStatus.update();
				RequestlistGrid.update();
				return;
			}
		}
	}
	

	return {
		init: function() {
			this.update();
			Ext.DomHelper.append('status-box', {tag:'div', id:'status-controls'});
			var fm = new Ext.form.Form({handler:function(){}});
			var reqB = fm.addButton('Update', function(){ this.update(); }, this);
			var canB = fm.addButton('Update All', function(){ 
				CurrentStatus.update();
				RequestlistGrid.update(); 
				ListTab.update(); 
			});
			//tb.add(reqB, canB);
			fm.render('status-controls');
			
		},
		
		update: function() {
			Ext.example.msg('Update current status', '');
			var time = new Date().getTime();
			lastUpdate = time;
			var ajax = Ext.lib.Ajax.request(
			'GET',
			'/json/status.json?_dc='+ new Date().getTime(), // IE need parameter.
			{
				success: function (res, args) {
					reset();
					var o = Ext.decode(res.responseText);
					if (o.length) {
						var html = String.format([
							'<p style="font-size:120%;">{0} - {1}</p>',
							'<p style="font-size:120%;"><span id="start_time">{2}</span> / <span id="end_time">{3}</span></p>',
							'<ul>',
							'<li>Requests: ', o.song_request_num, '</li>',
							'<li>Counter: ', o.http_request_num, '</li>',
							'<li>Active Connections: ', o.participant, '</li>',
							'<li>Download fils: ', o.current_download_num, '</li>',
							'</ul>',
							'',
							].join(''), o.artist, o.title, o.time_elapsed, o.length);
						Ext.get('status-panel').dom.innerHTML = html;
						JacketImageView.update( null, null, o.artist, o.title, o.album);
					} else {
						Ext.get('status-panel').dom.innerHTML = html = [
							'<p style="font-size:120%;"> Player stopped.</p>',
							'<br><br><br>',
							'<ul>',
							'<li>Requests: ', o.song_request_num, '</li>',
							'<li>Counter: ', o.http_request_num, '</li>',
							'<li>Active Connections: ', o.participant, '</li>',
							'</ul>',
							'',
						].join('')
					}
					if(o.enable_download == 1) {
						enableDownloadInPlaylist = true;
					}
					if(o.enable_download_only_in_upload == 1) {
						enableDownloadInUpload = true;
					}
					if(o.enable_download_in_history == 1) {
						enableDownloadInHistory = true;
					}
					//Ext.example.msg('Update success', html);
					if (!interval_id) {
						interval_id = window.setInterval(showTime, updateInterval * 1000 + 10); // avoid aggressive update.
					}
				},
				failure: function (res, args) {
					Ext.example.msg('Request failure', '');
				}
			});
		},
		
		isEnableDownloadInPlaylist : function() {
			return enableDownloadInPlaylist;
		},
		
		isEnableDownloadInUpload : function() {
			return enableDownloadInUpload;
		},
			
		isEnableDownloadInHistory : function() {
			return enableDownloadInHistory;
		}
		
		
		
	}
}();

var SearchBox = function(){
	
	return {
		init: function(target){
			var fm = new Ext.form.Form({handler:function(){}});
			var text = new Ext.form.TextField({
        			fieldLabel: 'Search',
	            	name: 'search',
		            width:150,
		            allowBlank:false
		        });
		    text.on('specialkey', function(field, e){
		    	if(e.getKey() == e.ENTER) {
		    		var v = text.getRawValue();
					SearchBox.search(v);
		    	}
		    });
			fm.add(text);
			var srhB = fm.addButton('Search', function(){
				var v = text.getRawValue();
				SearchBox.search(v);
			}, this);
			var clrB = fm.addButton('Clear', function(){ text.reset(); }, this);
			fm.render(target);
		},
		
		search: function(text) {
			SonglistDialog.create(
				'search='+ encodeURIComponent(text), 
				'Search: ' + text, 
				'search-' + text + 'gridid', 
				'search-panel'
			);
		}
	}
}();

// create the HelloWorld application (single instance)
var Usage = function(){
	// everything in this space is private and only accessible in the HelloWorld block
	
	// define some private variables
	var dialog, showBtn;
	
	// return a public interface
	return {
		init : function(){
			 showBtn = Ext.get('show-dialog-btn');
			 // attach to click event
			 showBtn.on('click', this.showDialog, this);
		},
	   
		showDialog : function(){
			if(!dialog){ // lazy initialize the dialog and only create it once
				dialog = new Ext.BasicDialog("usage-dlg", { 
						autoTabs:true,
						width:500,
						height:300,
						shadow:true,
						minWidth:300,
						minHeight:250,
						proxyDrag: true
				});
				dialog.addKeyListener(27, dialog.hide, dialog);
				//dialog.addButton('Submit', dialog.hide, dialog).disable();
				dialog.addButton('Close', dialog.hide, dialog);
			}
			dialog.show(showBtn.dom);
		}
	};
}();

var JacketImageView = function(){
	var amazonLast;
	var googleLast;
	var amagleLast;
	
	return {
		init: function(){
			
		},
		update: function(list_id, song_id, artist, title, album){
			var text = artist + ' ' + album;
			if (!album) artist + ' ' + title;
			var iframe1 = Ext.get('amazon-image');
			if (iframe1 && amazonLast != text) {
				amazonLast = text;
				iframe1.setVisible(false);
				iframe1.on('load', function(){
					iframe1.dom.src += '#Results';
					var s = iframe1.dom.src;
					iframe1.setVisible(true);
				});
				//iframe1.dom.src = 'http://www.alasuka.com/amazon_tool.cgi?SearchIndex=Music&Keywords=' + text + '&Yourid=4899860&w=200&Yn=1&bg=FFFFFF&fs=9&im=1&pv=0&sv=0&av=0&actv=0&dirv=0&pubv=0&pubdayv=0&simv=0&chex=1&mode=tool'
				iframe1.dom.src = //'http://www.amazon.co.jp/s/?tag=stwoqw-22&path=tg/browse/-/489986&__mk_ja_JP=カタカナ&url=index%3Dmusic-jp&initialSearch=1&field-keywords=' + title + '&Go.x=0&Go.y=0&Go=Go' + '#Results';
				'http://www.amazon.co.jp/gp/search?index=music-jp&keywords=' + encodeURIComponent(text) + '&tag=stwoqw-22&__mk_ja_JP=' + encodeURIComponent('カタカナ') + '&Go.x=4&Go.y=16&Go=Go&linkCode=qs';
			}
			
			var iframe2 = Ext.get('google-image');
			if (iframe2 && googleLast != text) {
				googleLast = text;
				iframe2.setVisible(false);
				iframe2.on('load', function(){ 
					iframe2.setVisible(true);
				});
				iframe2.dom.src = 'http://images.google.co.jp/images?hl=ja&imgsz=medium|large|xlarge&q=' + text + '#ImgContent';
			}
			
			if (list_id && song_id) {
				text = '?list_id=' + list_id + '&song_id=' + song_id;
				var iframe3 = Ext.get('amagle-image');
				if (iframe3 && amagleLast != text) {
					amagleLast = text;
					iframe3.setVisible(false);
					iframe3.on('load', function(){ 
						iframe3.setVisible(true);
					});
				iframe3.dom.src = '/jacket.html' + text;
				}
			} else {
				var iframe3 = Ext.get('amagle-image');
				if (iframe3 && amagleLast != text) {
					amagleLast = text;
					iframe3.setVisible(false);
					iframe3.on('load', function(){ 
						iframe3.setVisible(true);
					});
					iframe3.dom.src = '/jacket_current.html';
				}
			}
			
		}
	}
	
}();

Ext.onReady(function(){
	
	Usage.init(true);
	SonglistDialog.init();
	ListTab.init();
	CurrentStatus.init();
	SearchBox.init('search-panel');

	RequestlistGrid.init('requestlist-grid');
	
});
