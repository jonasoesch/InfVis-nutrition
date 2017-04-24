
function preprocess(d) {
    for (let e of Object.entries(d)) {
        if (e[1] === "") {
            d[e[0]] = 0;
        }
    }
    return d;
}

d3.csv('generic_foods.csv', preprocess, function(err, csv) {

    let allFoods = csv.map( function(entry) { 
        return {
            carbohydrates: entry["carbohydrates, available"],
            kJ: entry["energy kJ"],
            fat: entry["fat, total"],
            sugars: entry.sugars,
            protein: entry.protein,
            // water: entry.water
        };
    });

    let foods = [];
    for(let i = 1; i < 3; i++) {
        foods.push(allFoods[i]);
    }

    var axesNames = d3.keys(foods[0]);
    var dTheta = 2*Math.PI / axesNames.length;
    var axesAngles = axesNames.map((key, idx) => idx * dTheta);

    let margin = {top: 30, right: 30, bottom: 10, left: 30},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var R = d3.min([width, height])/2;
    var center = [width/2, height/2];

    var radiusScales = axesNames.map(function(axis) {
        var max = d3.max(foods, function(food) { return food[axis]; });
        return d3.scaleLinear()
            .domain([0, max])
            .range([0, R]);
    });

    var radialLine = d3.radialLine()
        .angle(function(d) { return d[0]; })
        .radius(function(d) { return d[1]; });

    let foodLine = function(food, i) {
       var wrangledData = axesNames.map(function(key, idx) {
            return [axesAngles[idx], radiusScales[idx](food[key])];
        });
        wrangledData.push(wrangledData[0]);
       return radialLine(wrangledData, i);
    };

    let coordSystem = svg.append("g")
        .attr('class', "coord-system")
        .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

    coordSystem.append("circle")
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 3)
        .attr('stroke', 'black')
        .attr('fill', 'black');

    coordSystem.selectAll('path')
        .data(foods)
        .enter()
        .append("path")
        .attr('stroke', 'red')
        .attr('d', foodLine);

    var axes = axesNames.map(function(axis, idx) {
        return d3.axisLeft(radiusScales[idx]);
    });

    axes.forEach(function (axis, idx) {
        coordSystem.append('g')
            .attr('class', 'axis')
            .attr('transform', 'rotate(' +  svgHasADifferentZeroAngle( axesAngles[idx] * 180/Math.PI ) + ')')
            .call(axis);
    });

    function svgHasADifferentZeroAngle(angle) {
        if(angle >= 180) {
            return angle - 180;
        } else {
            return angle + 180;
        }
    }

    // coordSystem.selectAll('.axis')
    //     .data(axesNames)
    //     .enter()
    //     .append('g')
    //     .attr('class', 'axis')
    //     .attr('transform', function(d, idx) {
    //         var degrees = axesAngles[idx] * 180/Math.PI;
    //         return 'rotate(' + degrees + ')';
    //     }).call(d => d);

    // coordSystem.selectAll('.axis')
    //     .text('hello world')
    //     .call(d => d);

    //  svg.append("g")
    //       .attr("id", "y_axis")
    //       .attr("transform", `translate(${yAxisOrigin.x}, ${yAxisOrigin.y})`)
    //       .call(yAxis);

    // let dimensions = svg.selectAll('.dimension')
    //     .data(axesNames)
    //     .enter()
    //     .append('g')
    //     .attr('class', 'dimension')
    //     .attr('transform', d => `translate(${xScale(d)})`);

    /*
    Careful, `this` is not bound correctly when using the arrow-function
    d => console.log(this) doesn't do what it should
     */
    // dimensions
    //     .append('g')
    //     .attr('class', 'axis')
    //     .each(function(d, i){
    //         yScale[d].el = d3.select(this).call(d3.axisLeft(yScale[axesNames[i]]));
    //     })
    //     .append('text')
    //     .style('text-anchor', 'middle')
    //     .style('fill', '#fff')
    //     .attr('y', -15)
    //     .text( d => d);


    //  dimensions
    //      .attr('class', 'brush')
    //      .each(function(d, i) {
    //          yScale[d].brush = d3.brushY().on('brush', brush);
    //          d3.select(this).call(yScale[d].brush);
    //      });
});
