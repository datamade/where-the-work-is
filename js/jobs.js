// variable init
var occupation_data;
var region_lep_mapping;
var regions_data;
var occ_map;


// do stuff when the page loads
(function(){

    initialize();
    
})()



function initialize(){

    $.when($.getJSON('data/merged_regions.geojson'), $.get('data/occupation_data.csv')).then(function(geojson, csv){
        regions_data = geojson
        raw_occupation_data = _.where($.csv.toObjects(csv[0]), {medium_skilled: "1"});
        occupation_data = _.map(
            raw_occupation_data,
            function(row) {
                return {
                    geography_name: row.geography_name,
                    geography_type: row.geography_type,
                    occupation: row.occupation,
                    demand_sum: parseInt(row.demand_entry_he)+parseInt(row.demand_entry_fe)+parseInt(row.demand_entry_sl),
                    demand_ticker: row.demand_ticker,
                    demand_entry_he: parseInt(row.demand_entry_he),
                    demand_entry_fe: parseInt(row.demand_entry_fe),
                    demand_entry_sl: parseInt(row.demand_entry_sl),
                    advertised_avg_salary_entry_degree: parseInt(row.advertised_avg_salary_entry_degree),
                    he_ds_ratio_log: parseFloat(row.he_ds_ratio_log),
                    fe_ds_ratio_log: parseFloat(row.fe_ds_ratio_log),
                    include_fe: row.include_fe,
                    include_he: row.include_he,
                    medium_skilled: row.medium_skilled,
                    lq: row.lq,
                    lq_label: row.lq_label
                };
            }
        );

        //merge region geojson and job data
        var job_types_region;
        var occupation_list = [];
        $.each(occupation_mapping, function(key, value) {occupation_list.push(String(key))});

        $.each(regions_data[0]['features'], function(r_index, region){
            $.each(occupation_list, function(k_index, occ) {
                job_types_region = _.where(occupation_data, {occupation: occ});
                $.each(job_types_region, function(j_index, job){
                    if (region.properties['JOB_REGION'] == job['geography_name']) {
                        region.properties[occ] = {};
                        region.properties[occ]['lq'] = job['lq'];
                        region.properties[occ]['lq_label'] = job['lq_label'];
                        region.properties[occ]['demand_sum'] = job['demand_sum'];
                        region.properties[occ]['demand_ticker'] = job['demand_ticker'];
                    }
                });
            });
        });

        if($.address.parameter("location_type") && $.address.parameter("location")){
            updateLocation(decodeURIComponent($.address.parameter("location_type")), decodeURIComponent($.address.parameter("location")))
        }
        else{
            updateLocation('Country', 'UK Total')
        }

        // populating select menu w/ regions & leps
        $.each(geo_hierarchy['children'], function(index, value){
            n = value['name']
            n_link_html = makeLinkHTML(n, toTitleCase(n), 'option-nation')
            $('#location-select-list').append('<li>'+n_link_html+'</li>')
            // loop thru regions within nation
            $.each(value['children'] , function(index, value){
                r = value['name']
                r_link_html =  makeLinkHTML(r, toTitleCase(r), 'option-region')
                $('#location-select-list').append('<li>'+r_link_html+'</li>')
                // loop thru leps within region
                $.each(value['children'] , function(index, value){
                    l = value['name']
                    l_link_html = makeLinkHTML(l, l, 'option-lep')
                    $('#location-select-list').append('<li>'+l_link_html+'</li>')
                });
            });
        });

        $('#control-pane').on('click', '.option-country', function() {
            updateLocation('Country', 'UK Total');
            return false;
        });
        $('#control-pane').on('click', '.option-nation', function() {
            updateLocation('Nation', $(this).attr('data'));
            return false;
        });
        $('#control-pane').on('click', '.option-region', function() {
            updateLocation('Region', $(this).attr('data'));
            return false;
        });
        $('#control-pane').on('click', '.option-lep', function() {
            updateLocation('LEP', $(this).attr('data'));
            return false;
        });

        $('#fe-select').click(function() {
            updateEducation('fe')
            return false;
        });
        $('#he-select').click(function() {
            updateEducation('he')
            return false;
        });

        $("#location-select-list li").click(function() {
           $("#location-dropdown-menu").dropdown("toggle");
        });

        MapsLib.initialize();
    });
}

function updateLocation(geo_type, geo_name){
    var education = decodeURIComponent($.address.parameter("education"))
    var geo_display_name = geo_name

    if(education != 'fe' && education != 'he'){
        // setting default education level
        education = 'fe'
    }

    if(geo_type=="Country" && geo_name=='UK Total'){
        geo_display_name = "The United Kingdom"
        $.address.parameter('location_type', '')
        $.address.parameter('location', '')
    }
    else{
        $.address.parameter('location_type', encodeURIComponent(geo_type))
        $.address.parameter('location', encodeURIComponent(geo_name))
        if(geo_type=="Nation" || geo_type=="Region"){
            geo_display_name = toTitleCase(geo_name)
        }
    }

    var place_data = _.where(occupation_data, {geography_type: geo_type, geography_name: geo_name})


    $("#current-location-name").text(geo_display_name)

    // updating breadcrumbs
    $('#breadcrumbs').html("&nbsp;") // TO-DO: add default text for breadcrumbs for uk
    var breadcrumb_links = makeBreadcrumbLinks(geo_name)
    $.each(breadcrumb_links, function(index, value){
        $('#breadcrumbs').append(value+' &raquo; ')
    });

    makeDemandChart('#bar-demand', place_data)
    // makeDemandScatterPlot('#scatter-demand', agg_data_scatter)
    makeCompScatterPlot('#scatter-comp', place_data, education)

    if ($.address.parameter('occupation')){
        selectOccupation(decodeURIComponent($.address.parameter('occupation')), place_data)
    }
}

function updateEducation(education){
    $.address.parameter('education', encodeURIComponent(education));

    // TO-DO: move this logic elsewhere
    if ($.address.parameter('location_type') && $.address.parameter('location')){
        var geo_type = decodeURIComponent($.address.parameter('location_type'))
        var geo_name = decodeURIComponent($.address.parameter('location'))
    }
    else {
        geo_type = 'Country'
        geo_name = 'UK Total'
    }

    var place_data = _.where(occupation_data, {geography_type: geo_type, geography_name: geo_name})

    makeCompScatterPlot('#scatter-comp', place_data, education)

    if ($.address.parameter('occupation')){
        selectOccupation(decodeURIComponent($.address.parameter('occupation')), place_data)
    }
}



function selectOccupation(occupation, place_data){
    // this populates the occupation detail pane on the main location view

    $("#occ-info-pane").removeClass("well-occ-inactive")
    $("#occ-info-pane").addClass("well-occ-active")
    $("#occ-info-pane").addClass("well-sm")
    $("#default-occ-info").hide()
    $("#occ-detail").show()

    $("#sel-occ-name").html(occupation)
    var tooltip_content = 'Jobs included:<br/><ul>'
    $.each(occupation_mapping[occupation]['example_titles'], function(index, title){
        tooltip_content = tooltip_content +'<li>'+ title + '</li>'
    });
    tooltip_content = tooltip_content+'</ul>'+occupation_mapping[occupation]['description']
    $("#sel-occ-desc").html('<a href="#" data-toggle="tooltip" data-placement="left" title="'+tooltip_content+'"><i class="fa fa-info-circle"></i></a>')

    var place_occ_data = _.where(place_data, {occupation: occupation})[0]



    demand_rank_str = getRankStr(place_data, 'demand_sum', place_occ_data['demand_sum'])


    var salary_fig = place_occ_data['advertised_avg_salary_entry_degree']
    if (salary_fig){
        salary_fig_str = '£'+numberWithCommas(salary_fig)
    }
    else {
        salary_fig_str = '--'
    }
    salary_rank_str = getRankStr(place_data, 'advertised_avg_salary_entry_degree', salary_fig)


    var comp_fig = place_occ_data['he_ds_ratio_log']
    if (comp_fig){
        comp_fig_str = comp_fig
    }
    else {
        comp_fig_str = '--'
    }
    comp_rank_str = getRankStr(place_data, 'he_ds_ratio_log', comp_fig)

    $("#occ-figure-demand").html(numberWithCommas(place_occ_data['demand_sum']))
    $("#occ-figure-salary").html(salary_fig_str)
    $("#occ-figure-comp").html(comp_fig_str)

    $("#occ-rank-demand").html(demand_rank_str)
    $("#occ-rank-salary").html(salary_rank_str)
    $("#occ-rank-comp").html(comp_rank_str)


    $('#btn-occ-lq').click(function() {
        $('#occupation-detail-modal').modal('show');
        return false;
    });

    $('#occupation-detail-modal').on('shown.bs.modal', function (e) {
        // $("#occupation-detail-map").spin('large');
        MapsLib.occ_map._onResize();
        $('#mapToggleProspects').click();
    });

    $('#mapToggleProspects').on('click', function (e) {
        MapsLib.updateData(occupation, 'lq_label');
    });

    $('#mapToggleDemand').on('click', function (e) {
        MapsLib.updateData(occupation, 'demand_ticker');
    });

    $.address.parameter('occupation', encodeURIComponent(occupation));

    highlightOcc(occupation);

    $('[data-toggle="tooltip"]').tooltip({
                html: true
            });
}


function getRankStr(place_data, occ_figure_name, occ_figure_val){
    if (occ_figure_val){
        // do stuff
        rank = 1;
        out_of = 0;
        $.each(place_data, function(index, row){
            if(row[occ_figure_name]){
                out_of = out_of+1;
                if(row[occ_figure_name]>occ_figure_val){
                    rank = rank+1;
                };
            };
        });

        return '#'+rank+' <small>of '+out_of+'</small>';
    }
    else{
        return '--'
    }
}




function makeLinkHTML(data, display_name, cls){
    return '<a class="'+cls+'" data="'+data+'" href="">'+display_name+'</a>'
}

function makeBreadcrumbLinks(geo_name){
    if(geo_name=='UK Total'){
        return [];
    }
    else{
        var links = [ makeLinkHTML("UK Total", "The United Kingdom", "option-country") ]
        var b = breadcrumbs[geo_name]
        if(b.length==0){
            return links
        }
        else if(b.length==1){
            var n = b[0]
            return links.concat( [makeLinkHTML(n, toTitleCase(n), 'option-nation')] )
        }
        else if(b.length==2){
            var n = b[0]
            var r = b[1]
            return links.concat( [makeLinkHTML(n, toTitleCase(n), 'option-nation'), makeLinkHTML(r, toTitleCase(r), 'option-region')] )
        }
    }
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}
