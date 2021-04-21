import * as api from "./api.js";
import * as util from "./util.js";
import * as model from "./model.js";
import * as settings from "./settings.js";
import * as dlgPickUser from "./dlg_pick_user.js";
import * as dlgPickProj from "./dlg_pick_proj.js";
import * as dlgSchemaList from "./dlg_schema_list.js";
import * as dlgQueryBuild from "./dlg_query_builder.js";

//$("#run_qry_btn").addClass("ui-state-error");


export function newSearchPanel( a_frame, a_parent ){
    return new SearchPanel( a_frame, a_parent );
}

function SearchPanel( a_frame, a_parent ){
    var inst = this,
        tags_div = $("#srch_tags_div",a_frame),
        user_tags = [],
        date_from = $("#srch_date_from",a_frame),
        date_from_ts = $("#srch_date_from_ts",a_frame),
        date_to = $("#srch_date_to",a_frame),
        date_to_ts = $("#srch_date_to_ts",a_frame),
        enabled = false,
        srch_scope = $("#srch_scope",a_frame);


    this.setSearchSelect = function( a_id_set ){
        var html = "";
        if ( a_id_set && !util.isObjEmpty( a_id_set )){
            var title;
            for ( var id in a_id_set ){
                title = a_id_set[id];
                html += "<div class='srch-scope-item' data='" + id +
                    "' title='" + id + "'><div class='row-flex' style='width:100%'><div style='flex:1 1 auto;white-space:nowrap;overflow:hidden'>" + title +
                    "</div><div class='srch-scope-btn-div' style='flex:none'><button class='srch-scope-rem-btn btn btn-icon'><span class='ui-icon ui-icon-close'></span></button></div></div></div>";
            }
            srch_scope.html(html);
            $(".btn",srch_scope).button();
            $("#srch_run_btn",a_frame).button("option","disabled",false);
            enabled = true;
        }else{
            srch_scope.html(html);
            $("#srch_run_btn",a_frame).button("option","disabled",true);
            enabled = false;
        }
    }

    this.buildSearch = function(){
        var tmp, query = {};

        query.mode = parseInt( $(".srch-mode",a_frame).val() );

        query.sort = parseInt( $(".srch-sort",a_frame).val() );
        if ( query.sort < 0 ){
            query.sort = -query.sort;
            query.sortRev = true;
        }else{
            query.sortRev = false;
        }

        tmp = $("#srch_id",a_frame).val();
        if ( tmp )
            query.id = tmp;

        tmp = $("#srch_text",a_frame).val();
        if ( tmp )
            query.text = tmp;
    
        query.tags = user_tags;

        if ( date_from.val() ){
            query.from = parseInt( date_from_ts.val() )/1000;
        }

        if ( date_to.val() ){
            query.to = parseInt( date_to_ts.val() )/1000;
        }

        tmp = $("#srch_creator",a_frame).val().trim();
        if ( tmp ){
            query.creator = tmp;
        }

        if ( query.mode == model.SM_DATA ){
            tmp = $("#srch_sch_id",a_frame).val();
            if ( tmp )
                query.schId = tmp;

            tmp = $("#srch_meta",a_frame).val();
            if ( tmp )
                query.meta = tmp;
        
            if ( $( "#srch_meta_err", a_frame ).prop("checked")){
                query.metaErr = true;
            }
        }

        return query;
    }
    
    this.runSearch = function(){
        a_parent.searchPanel_Run( inst.buildSearch() );
    }

    // ----- Run query button -----

    $("#srch_run_btn",a_frame).on("click", function(){
        //a_parent.searchPanel_Run( inst.buildSearch() );
        inst.runSearch();
    });

    // ----- Save query button -----

    $("#srch_save_btn",a_frame).on("click", function(){

    });


    // ----- Search mode -----

    $(".srch-mode",a_frame).on("selectmenuchange", function(){
        var cur_mode = parseInt( $(".srch-mode",a_frame).val() );
        if ( cur_mode == model.SM_DATA ){
            $(".srch-data-options",a_frame).show();
        }else{
            $(".srch-data-options",a_frame).hide();
        }
    });

    // ----- Search Scope (selection) -----

    $("#srch_scope",a_frame).on("click",".srch-scope-rem-btn",function(){
        var el = $(this),
            item = el.closest(".srch-scope-item"),
            id = item.attr("data");

        a_parent.searchPanel_RemoveScope( id );
        item.remove();
    });

    $("#srch_scope_clear",a_frame).on("click",function(){
        inst.setSearchSelect();
        a_parent.searchPanel_ClearScope();
    });

    // ----- Tag input setup -----

    tags_div.tagit({
        autocomplete: {
            delay: 500,
            minLength: 3,
            source: "/api/tag/autocomp"
        },
        caseSensitive: false,
        removeConfirmation: true,
        afterTagAdded: function( ev, ui ){
            user_tags.push( ui.tagLabel );
            inst.runSearch();
        },
        beforeTagRemoved: function( ev, ui ){
            var idx = user_tags.indexOf( ui.tagLabel );
            if ( idx != -1 )
                user_tags.splice( idx, 1 );
        },
        afterTagRemoved: function(){
            inst.runSearch();
        }
    });

    $(".tagit-new",a_frame).css("clear","left");

    $("#srch_tags_clear",a_frame).on("click",function(){
        var refresh = user_tags.length?true:false;
        tags_div.tagit("removeAll");
        if ( refresh ){
            inst.runSearch();
        }
    });

    // ----- Search ID setup -----

    $("#srch_id_clear",a_frame).on("click",function(){
        if ( $("#srch_id",a_frame).val().trim().length ){
            $("#srch_id",a_frame).val("");
            inst.runSearch();
        }
    });
    
    // ----- Text fields input setup -----

    $("#srch_id,#srch_text,#srch_creator,#srch_meta,#srch_sch_id",a_frame).on("keypress",function( ev ){
        if ( ev.keyCode == 13 ){
            ev.preventDefault();
            if ( enabled ){
                //a_parent.searchPanel_Run( inst.buildSearch() );
                inst.runSearch();
            }
        }
    });

    $("#srch_text_clear",a_frame).on("click",function(){
        if ( $("#srch_text",a_frame).val().trim().length ){
            $("#srch_text",a_frame).val("");
            inst.runSearch();
        }
    });

    // ----- Schema input setup -----

    $("#srch_sch_pick",a_frame).on("click",function(){
        dlgSchemaList.show( true, false, function( schema ){
            var id = schema.id + ":" + schema.ver;
            if ( $("#srch_sch_id",a_frame).val() != id ){
                $("#srch_sch_id",a_frame).val( id );
                inst.runSearch();
            }
        });
    });

    $("#srch_sch_clear",a_frame).on("click",function(){
        if ( $("#srch_sch_id",a_frame).val().trim().length ){
            $("#srch_sch_id",a_frame).val("");
            inst.runSearch();
        }
    });

    // ----- Metadata input setup -----

    $("#srch_meta_build",a_frame).on("click",function(){
        var sch_id = $("#srch_sch_id",a_frame).val().trim();
        if ( sch_id ){
            api.schemaView( sch_id, true, function( ok, reply ){
                if ( !ok ){
                    util.setStatusText( reply, true );
                }
                dlgQueryBuild.show( ok?reply.schema[0]:null );
            });
        }else{
            dlgQueryBuild.show();
        }
    });

    $("#srch_meta_clear",a_frame).on("click",function(){
        if ( $("#srch_meta",a_frame).val().trim().length ){
            $("#srch_meta",a_frame).val("");
            inst.runSearch();
        }
    });

    // ----- Creator input setup -----

    $("#srch_creator_pick_user",a_frame).on("click",function(){
        dlgPickUser.show( "u/"+settings.user.uid, [], true, function( users ){
            if ( $("#srch_creator",a_frame).val().trim() != users[0] ){
                $("#srch_creator",a_frame).val( users[0] );
                inst.runSearch();
            }
        });
    });

    $("#srch_creator_clear",a_frame).on("click",function(){
        if ( $("#srch_creator",a_frame).val().trim().length ){
            $("#srch_creator",a_frame).val("");
            inst.runSearch();
        }
    });

    // ----- Date input setup -----

    date_from.datepicker({
        altField: "#srch_date_from_ts",
        altFormat: "@",
        beforeShow: function(){
            var _to = date_to.val();
            if ( _to ){
                date_from.datepicker( "option", "maxDate", _to );
            }
        },
        onClose: function( date ){
            if ( date ){
                inst.runSearch();
            }
        }
    });

    date_to.datepicker({
        altField: "#srch_date_to_ts",
        altFormat: "@",
        beforeShow: function( input, picker ){
            var _from = date_from.val();
            if ( _from ){
                date_to.datepicker( "option", "minDate", _from );
            }
        },
        onClose: function( date ){
            if ( date ){
                inst.runSearch();
            }
        }
    });

    $("#srch_datetime_clear",a_frame).on("click",function(){
        date_from.val("");
        date_to.val("");
        inst.runSearch();
    });

    util.inputTheme( $('input,textarea', a_frame ));

    $(".srch-mode",a_frame).selectmenu({ width: false });
    $(".srch-sort",a_frame).selectmenu({ width: false });

    $(".accordion.acc-act",a_frame).accordion({
        header: "h3",
        collapsible: true,
        heightStyle: "content",
        create: function( ev, ui ){
            ui.header.removeClass("ui-state-active");
        },
        activate: function( ev, ui ){
            ui.newHeader.removeClass("ui-state-active");
        }
    });

    $(".accordion:not(.acc-act)",a_frame).accordion({
        header: "h3",
        collapsible: true,
        heightStyle: "content",
        active: false,
        activate: function( ev, ui ){
            ui.newHeader.removeClass("ui-state-active");
        }
    });

    return this;
}
