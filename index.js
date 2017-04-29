const DEBUG = true;

function dd(obj){
    if(DEBUG === true) {
        console.log(obj);
    }
}

d3.tsv('data/food-data.txt', function(err, tsv) {


    let foods_full = tsv.map( function(entry) { return {
        "carbohydrates": entry["carbohydrates, available"],
        "category": entry["category D"],
        "kJ": entry["energy kJ"],
        "fat": entry["fat, total"],
        "fat, polyunsaturated": entry["fatty acids, polyunsaturated"],
        "fat, monounsaturated": entry['fatty acids, monounsaturated'],
        "fat, saturated": entry['fatty acids, saturated']
    }});



    let foods = [];
    for(let i = 0; i < 10; i++) {
        foods.push(foods_full[i]);
    }

    let axesNames = d3.keys(foods[0]).filter(function(key) {
        if (key === "category") return ;
        else return key;
    });


    let margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;


    // Setting up the canvas
    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Defining where the axes should be placed on x
    let xAxisPositions = function(axis) {
        let len = axis.length -1;
        return axis.map((key, i) => i * width/len);
    };

    let xScale = d3.scaleOrdinal()
        .range(xAxisPositions(axesNames))
        .domain(axesNames);

    let yScale = {};
    axesNames.forEach(function(axis){
        let max = 0;
        if (axis === 'kJ') max = d3.max(foods, food => Number(food["kJ"]));
        else max = 100;

        yScale[axis] = d3.scaleLinear()
            .domain([0, max])
            .range([height, 0]);
    });


    let line = d3.line()
        .x(d => xScale(d.x))
        .y((d, i) => yScale[axesNames[i]](d.y));


    let foodLine = function(food, i) {
       let wrangledData= axesNames.map(function(key, i) {
            return {x: key, y: food[key]};
        });
       return line(wrangledData, i);

    };


    // Add grey background lines for context when brushing
    let background = svg.append("g")
        .attr("class", "background")
        .selectAll('path')
        .data(foods)
        .enter()
        .append("path")
        .attr('d', foodLine);
    // foodLine -> line -> selectYScale -> energyScale | nutrientScale -> yValue

    let foreground = svg.append("g")
        .attr('class', "foreground")
        .selectAll('path')
        .data(foods)
        .enter()
        .append("path")
        .attr('stroke', 'red')
        .attr('d', foodLine);
        // foodLine -> line -> selectYScale -> energyScale | nutrientScale -> yValue

    let dimensions = svg.selectAll('.dimension')
        .data(axesNames)
        .enter()
        .append('g')
        .attr('class', 'dimension')
        .attr('transform', d => `translate(${xScale(d)})`);

    /*
    Careful, `this` is not bound correctly when using the arrow-function
    d => console.log(this) doesn't do what it should
     */
    dimensions
        .append('g')
        .attr('class', 'axis')
        .each(function(d, i){
            yScale[d].el = d3.select(this).call(d3.axisLeft(yScale[axesNames[i]]));
        })
        .append('text')
        .style('text-anchor', 'middle')
        .style('fill', '#fff')
        .attr('y', -15)
        .text( d => d);


     dimensions
         .attr('class', 'brush')
         .each(function(d, i) {
             yScale[d].brush = d3.brushY().on('brush', brush);
             d3.select(this).call(yScale[d].brush);
         });


    function brush(axis) {

        let activeBrushes = [];
        axesNames.forEach(function(axisName) {
            let axisEl = yScale[axisName].el.node();
            let brush = d3.brushSelection(axisEl.parentNode);
            if(brush !== null) {
                activeBrushes.push({
                    name: axis,
                    min: brush[0],
                    max: brush[1]
                });
            }
        });


        let visibility = function(d) {
            let sel = d3.select(this).data()[0];
            let isVisible = true;
            activeBrushes.forEach(function(brush){
                let value = (yScale[brush.name](sel[brush.name]));
                if( value > brush.max) {
                    isVisible = false;
                } else if (value < brush.min) {
                    isVisible = false;
                }
            });

            if(!isVisible) {
                return 'none'
            } else {
                return null;
            }
        };

        foreground
            .style('display', visibility);
    }


});
