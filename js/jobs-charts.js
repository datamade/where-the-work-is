Highcharts.setOptions({
    lang: {
        thousandsSep: ','
    }
});



function initializeTable(table_id, column_names, data){
    // column_names is an array of names to be used as the header row of the table
    // data is a 2D array of values for the table
    var names = [];
    $.each(column_names, function(i, name){
        names.push({'title': name});
    })
    $(table_id).DataTable({
        searching: false,
        lengthMenu: [ [20, 100, -1], [20, 100, "All"] ],
        destroy: true,
        data: data,
        columns: names,
        info: false,
        paging: false
    });
}


function makeDemandChart(element_id, data){
    var clean_demand_data = _.map(
        data, 
        function(row) {
            return { 
                demand_sum: parseInt(row.demand_entry_he)+parseInt(row.demand_entry_fe)+parseInt(row.demand_entry_sl),
                demand_entry_he: parseInt(row.demand_entry_he),
                demand_entry_fe: parseInt(row.demand_entry_fe),
                demand_entry_sl: parseInt(row.demand_entry_sl),
                occupation: row.occupation
            };
        }
    );
    var sorted_data = _.sortBy(clean_demand_data, 'demand_sum').reverse()


    var n_cols = 36
    var prepped_data = [
        {
            name: 'Higher Education',
            color: '#006167',
            data: _.pluck(sorted_data, "demand_entry_he").slice(0,n_cols)
        }, {
            name: 'Further Education',
            color: '#fbab18',
            data: _.pluck(sorted_data, "demand_entry_fe").slice(0,n_cols)
        }
        , {
            name: 'School Leavers',
            color: '#f47730',
            data: _.pluck(sorted_data, "demand_entry_sl").slice(0,n_cols)
        }
    ]

    occupations = _.pluck(sorted_data, "occupation").slice(0,n_cols)

    stackedBarHelper(element_id, prepped_data, occupations, 'Demand', 'Demand (# jobs)')
}

function makeSalaryChart(element_id, data){
    var clean_data = _.map(
        data, 
        function(row) {
            salary = parseInt(row.advertised_avg_salary_entry_degree)
            if(isNaN(salary)){
                salary = 0
            }
            return { 
                advertised_avg_salary_entry_degree: salary,
                occupation: row.occupation
            };
        }
    );
    var sorted_data = _.sortBy(clean_data, 'advertised_avg_salary_entry_degree').reverse()
    var prepped_data = [
        {
            name: 'Average Entry Salary',
            color: '#eee',
            data: _.pluck(sorted_data, "advertised_avg_salary_entry_degree")
        }
    ]
    occupations = _.pluck(sorted_data, "occupation")
    y_axis_blob = {
            min: 0,
            gridLineWidth: 0,
            endOnTick: false,
            title: {
                text: 'Average Entry Salary',
                style: {
                    color: '#aaa'
                }
            },
            labels: {
                style: {
                    color: '#aaa',
                    fontSize: '9px',
                }
            }
        }
    barHelper(element_id, prepped_data, occupations, 'Salary', y_axis_blob)

}

function makeCompChart(element_id, data){
    var clean_data = _.map(
        data, 
        function(row) {
            c = parseInt(row.fe_ds_ratio_log)
            if(isNaN(salary)){
                c = 0
            }
            return { 
                fe_ds_ratio_log: c,
                occupation: row.occupation
            };
        }
    );
    var sorted_data = _.sortBy(clean_data, 'fe_ds_ratio_log').reverse()
    var prepped_data = [
        {
            name: 'Opportunity',
            color: '#eee',
            data: _.pluck(sorted_data, "fe_ds_ratio_log")
        }
    ]
    occupations = _.pluck(sorted_data, "occupation")
    y_axis_blob = {
            gridLineWidth: 0,
            endOnTick: false,
            title: {
                text: 'Opportunity',
                style: {
                    color: '#aaa'
                }
            },
            labels: {
                style: {
                    color: '#aaa',
                    fontSize: '9px',
                }
            }
        }
    barHelper(element_id, prepped_data, occupations, 'Opportunity', y_axis_blob)

}


// function makeDemandScatterPlot(element_id, data){
//     var prepped_data = []
//     $(data).each(function(i, row){
//         point = {
//             x: parseFloat(row['advertised_avg_salary_entry_degree']),
//             y: parseFloat(row['demand_entry']),
//             name: shortenName(row['occupation']),
//             full_name: row['occupation']
//         }
//         if (!isNaN(point.x) && !isNaN(point.y)) prepped_data.push(point)
//     })

//     scatterHelper(element_id, prepped_data, 'Demand', 'Demand (# jobs)', ['More Jobs', 'Fewer Jobs'])
// }

// function makeCompScatterPlot(element_id, data){
//     var prepped_data = []
//     $(data).each(function(i, row){
//         point = {
//             x: parseFloat(row['advertised_avg_salary_entry_degree']),
//             y: parseFloat(row['fe_ds_ratio_log']),
//             name: shortenName(row['occupation']),
//             full_name: row['occupation']
//         }
//         if (!isNaN(point.x) && !isNaN(point.y)) prepped_data.push(point)
//     })

//     scatterHelper(element_id, prepped_data, 'Opportunity', 'Opportunity', ['Less Competition', 'More Competition'])
// }



// function scatterHelper(element_id, prepped_data, y_label_full, y_label_short, chart_labels){
//     var chart_height = $(element_id).height()

//     $(element_id).highcharts({

//         chart: {
//             type: 'scatter',
//             zoomType: 'xy',
//             plotBackgroundColor: {
//                 linearGradient: [0, 0, 0, chart_height],
//                 stops: [
//                     [0, 'rgb(225, 242, 241)'], //green
//                     [1, 'rgb(242, 231, 225)']  //red
//                 ]
//             }
//         },

//         credits: {
//             enabled: false
//         },

//         legend: {
//             enabled: false
//         },

//         title: {
//             text: ''
//         },

//         xAxis: {
//             title: {
//                 text: 'Average Salary',
//                 style: {
//                     color: '#aaa',
//                 }
//             },
//             labels: {
//                 format: '£{value}',
//                 style: {
//                     color: '#aaa',
//                     fontSize: '9px',
//                 }
//             },
//             tickColor: '#eee',
//             tickLength: 5,
//             lineColor: '#eee'
//         },

//         yAxis: {
//             gridLineWidth: 0,
//             title: {
//                 text: y_label_full,
//                 style: {
//                     color: '#aaa',
//                 }
//             },
//             labels: {
//                 style: {
//                     color: '#aaa',
//                     fontSize: '9px',
//                 }
//             }
//         },

//         tooltip: {
//             useHTML: true,
//             headerFormat: '<table>',
//             pointFormat: '<tr><th colspan="2"><strong>{point.full_name}</strong></th></tr>' +
//                 '<tr><th>Average Salary:</th><td>£{point.x:,.0f}</td></tr>' +
//                 '<tr><th>'+y_label_short+':</th><td>{point.y}</td></tr>',
//             footerFormat: '</table>',
//             followPointer: true
//         },

//         labels: {
//             items: [
//                 {
//                     html: "↑ "+chart_labels[0],
//                     style: {
//                         color: '#006167',
//                         left: '10px',
//                         top: '10px',
//                     }
//                 },
//                 {
//                     html: "↓ "+chart_labels[1],
//                     style: {
//                         color: '#f47730',
//                         left: '10px',
//                         top: chart_height - 90
//                     }
//                 }
//             ]
//         },

//         plotOptions: {
//             series: {
//                 cursor: 'pointer',
//                 dataLabels: {
//                     enabled: true,
//                     format: '{point.name}',
//                     style: {
//                         fontWeight: 'normal',
//                         fontSize: '8px',
//                         color: '#777'
//                     }
//                 },
//                 color: '#777',
//                 allowPointSelect: true,
//                 point: {
//                     events: {
//                         select: function () {
//                             showOccupationDetail(this.full_name);
//                         }
//                     }
//                 }
//             },
//         },

//         series: [{
//             data: prepped_data,
//         }]

//     });
// }


function stackedBarHelper(element_id, prepped_data, categories, y_label_full, y_label_short){
    $(element_id).highcharts({
        chart: {
            type: 'bar'
        },
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: categories,
            tickWidth: 0,
            labels: {
                formatter: function () {
                    return shortenName(this.value);
                },
                style: {
                    fontSize: '9px'
                }
            },
            lineColor: '#eee'
        },
        yAxis: {
            min: 0,
            gridLineWidth: 0,
            endOnTick: false,
            title: {
                text: y_label_short,
                style: {
                    color: '#aaa'
                }
            },
            labels: {
                style: {
                    color: '#aaa',
                    fontSize: '9px',
                }
            }
        },
        legend: {
            align: 'right',
            layout: 'vertical',
            x: -30,
            verticalAlign: 'top',
            y: 50,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table><tr><th colspan="2"><strong>{point.x}</strong></th></tr>',
            pointFormat:  '<tr><th>{series.name}:</th><td>{point.y:,.0f}</td></tr>',
            footerFormat: '</table>',
            shared: true
        },
        plotOptions: {
            bar: {
                stacking: 'normal'
            },
            series: {
                cursor: 'pointer',
                pointPadding: 0,
                groupPadding: .1,
                point: {
                    events: {
                        click: function () {
                            showOccupationDetail(categories[this.x]);
                        }
                    }
                }
            }
        },
        series: prepped_data
    });
}


function barHelper(element_id, prepped_data, categories, y_label_full, y_axis_blob){
    $(element_id).highcharts({
        chart: {
            type: 'bar'
        },
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: categories,
            tickWidth: 0,
            labels: {
                formatter: function () {
                    return shortenName(this.value);
                },
                style: {
                    fontSize: '9px'
                }
            },
            lineColor: '#eee'
        },
        yAxis: y_axis_blob,
        legend: {
            enabled: false
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table><tr><th colspan="2"><strong>{point.x}</strong></th></tr>',
            pointFormat:  '<tr><th>{series.name}:</th><td>{point.y:,.0f}</td></tr>',
            footerFormat: '</table>',
            shared: true
        },
        plotOptions: {
            bar: {
                stacking: 'normal'
            },
            series: {
                cursor: 'pointer',
                pointPadding: 0,
                groupPadding: .1,
                point: {
                    events: {
                        click: function () {
                            showOccupationDetail(categories[this.x]);
                        }
                    }
                }
            }
        },
        series: prepped_data
    });
}





function shortenName(long_name) {
    return long_name.split(" ")[0].replace(/,/g , "");
}