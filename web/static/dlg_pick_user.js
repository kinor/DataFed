function dlgPickUser(  a_uid, a_excl, a_single_sel, cb ){
    var content =
        "<div class='ui-widget-content text' style='height:98%;overflow:auto'>\
            <div id='dlg_user_tree' class='no-border'></div>\
        </div>";

    this.userPageLoad = function( key, offset ){
        console.log("userPageLoad",key, offset);
        var node = tree.getNodeByKey( key );
        if ( node ){
            node.data.offset = offset;
            //console.log("new offset:",node.data.offset);
            node.load(true);
        }
    }

    var frame = $(document.createElement('div'));
    frame.html( content );

    var options = {
        title: "Select User(s)",
        modal: true,
        width: 400,
        height: 500,
        resizable: true,
        closeOnEscape: false,
        buttons: [{
            text: "Ok",
            click: function() {
                users = [];
                var tree = $("#dlg_user_tree",frame).fancytree("getTree");
                var sel = tree.getSelectedNodes();
                var key;
                for ( var i in sel ){
                    key = sel[i].key;
                    if ( users.indexOf( key ) == -1 )
                        users.push( key );
                }
                cb( users );
                $(this).dialog('destroy').remove();
            }
        },{
            text: "Cancel",
            click: function() {
                $(this).dialog('destroy').remove();
            }
        }],
        open: function(event,ui){
        }
    };

    var src = [
        {title:"Collaborators",icon:"ui-icon ui-icon-view-list",folder:true,lazy:true,checkbox:false,key:"collab"},
        {title:"By Groups",icon:"ui-icon ui-icon-view-list",folder:true,lazy:true,checkbox:false,key:"groups"},
        {title:"All",icon:"ui-icon ui-icon-folder",folder:true,lazy:true,checkbox:false,key:"all",offset:0}
    ];

    //src.push({title:"By Projects",icon:false,folder:true,lazy:true,checkbox:false,key:"projects"});

    $("#dlg_user_tree",frame).fancytree({
        extensions: ["themeroller"],
        themeroller: {
            activeClass: "ui-state-hover",
            addClass: "",
            focusClass: "",
            hoverClass: "ui-state-active",
            selectedClass: ""
        },
        source: src,
        selectMode: a_single_sel?1:2,
        checkbox: true,
        lazyLoad: function( event, data ) {
            if ( data.node.key == "collab" ) {
                data.result = {
                    url: "/api/usr/list/collab?offset="+data.node.data.offset+"&count="+g_opts.page_sz,
                    cache: false
                };
            } else if ( data.node.key == "groups" ) {
                data.result = {
                    url: "/api/grp/list?uid="+a_uid,
                    cache: false
                };
            } else if ( data.node.key == "all" ) {
                data.result = {
                    url: "/api/usr/list/all?offset="+data.node.data.offset+"&count="+g_opts.page_sz,
                    cache: false
                };
            } else if ( data.node.key.startsWith("g/")){
                data.result = {
                    url: "/api/grp/view?uid="+encodeURIComponent(a_uid)+"&gid="+encodeURIComponent(data.node.key.substr(2)),
                    cache: false
                };
            }
        },
        postProcess: function( event, data ) {
            if ( data.node.key == "collab" || data.node.key == "all" ){
                console.log( "user list:",data.response);
                data.result = [];
                var user;
                for ( var i in data.response.user ) {
                    user = data.response.user[i];
                    if ( a_excl.indexOf( user.uid ) == -1 )
                        data.result.push({ title: user.name + " ("+user.uid.substr(2) +")",icon:"ui-icon ui-icon-person",key: user.uid });
                }

                if ( data.response.offset > 0 || data.response.total > (data.response.offset + data.response.count) ){
                    var pages = Math.ceil(data.response.total/g_opts.page_sz), page = 1+data.response.offset/g_opts.page_sz;
                    data.result.push({title:"<button class='btn small''"+(page==1?" disabled":"")+" onclick='userPageLoad(\""+data.node.key+"\",0)'>First</button> <button class='btn small'"+(page==1?" disabled":"")+" onclick='userPageLoad(\""+data.node.key+"\","+(page-2)*g_opts.page_sz+")'>Prev</button> Page " + page + " of " + pages + " <button class='btn small'"+(page==pages?" disabled":"")+" onclick='userPageLoad(\""+data.node.key+"\","+page*g_opts.page_sz+")'>Next</button> <button class='btn small'"+(page==pages?" disabled":"")+" onclick='userPageLoad(\""+data.node.key+"\","+(pages-1)*g_opts.page_sz+")'>Last</button>",folder:false,icon:false,checkbox:false,hasBtn:true});
                }
            } else if ( data.node.key == "groups" ){
                data.result = [];
                var group;
                for ( var i in data.response ) {
                    group = data.response[i];
                    if ( a_excl.indexOf( "g/"+group.gid ) == -1 )
                        data.result.push({ title: group.title + " ("+group.gid +")",icon:"ui-icon ui-icon-persons",checkbox:false,folder:true,lazy:true,key:"g/"+group.gid });
                }
            } else if ( data.node.key.startsWith("g/")){
                data.result = [];
                var mem;
                for ( var i in data.response.member ) {
                    mem = data.response.member[i];
                    if ( a_excl.indexOf( mem ) == -1 )
                        data.result.push({ title: mem.substr(2),icon:"ui-icon ui-icon-person",key:mem});
                }
            }
        },
        renderNode: function(ev,data){
            if ( data.node.data.hasBtn ){
                $(".btn",data.node.li).button();
            }
        },
    });

    var tree = $("#dlg_user_tree",frame).fancytree("getTree");

    frame.dialog( options );
}
