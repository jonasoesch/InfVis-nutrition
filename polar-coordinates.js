
function preprocess(d) {
    for (let e of Object.entries(d)) {
        // Set empty strings to be value 0.
        if (e[1] === "") {
            d[e[0]] = 0;
        }
        // Convert all string numbers to integers.
        let number = parseInt(e[1]);
        if (!isNaN(number)) {
            d[e[0]] = number;
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
            water: entry.water
        };
    });

    let foods = [];
    for(let i = 1; i < 3; i++) {
        foods.push(allFoods[i]);
    }

    var axesNames = d3.keys(foods[0]);
    var dTheta = 2*Math.PI / axesNames.length;
    var axesAngles = axesNames.map((key, idx) => idx * dTheta);

    let margin = {top: 30, right: 30, bottom: 30, left: 30},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var R = d3.min([width, height])/2;
    var r = 30;
    var center = [width/2, height/2];

    var radiusScales = axesNames.map(function(axis) {
        var max = d3.max(foods, function(food) { return food[axis]; });
        return d3.scaleLinear()
            .domain([0, max])
            .range([r, R]);
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

    coordSystem.selectAll('path')
        .data(foods)
        .enter()
        .append("path")
        .attr('class', 'food-line')
        .attr('d', foodLine);
    
    coordSystem.append('path')
        .attr('class', 'guiding-line')
        .attr('d', createGuidingLine(axesAngles, R));

    var axes = axesNames.map(function(axis, idx) {
        return d3.axisLeft(radiusScales[idx])
            .ticks(5);
    });

    var adaptedAxesAngles = adaptAxesAnglesToSvg(axesAngles);

    axes.forEach(function (axis, idx) {
        coordSystem.append('g')
            .attr('class', 'axis')
            .attr('transform', 'rotate(' + adaptedAxesAngles[idx] + ')')
            .call(axis)
            .append('text')
                .attr('fill', 'black')
                .attr('y', R+15)
                .attr('transform', 'rotate(' + -adaptedAxesAngles[idx] + ',0,' + (R+15) + ')')
                .attr('text-anchor', getTextAnchor(adaptedAxesAngles[idx]))
                .text(axesNames[idx]);
    });


    function getTextAnchor(axisAngle) {
        let eps = 1;
        if (180-eps < axisAngle && axisAngle < 180+eps ||
                0-eps < axisAngle && axisAngle < 0+eps) {
            return 'middle';
        }
        if (axisAngle < 180) {
            return 'end';
        } else {
            return 'start';
        }
    }

    function adaptAxesAnglesToSvg(axesAngles) {
        return axesAngles.map(function(axisAngle) {
            return svgHasADifferentZeroAngle( axisAngle * 180/Math.PI );
        });
    }

    function svgHasADifferentZeroAngle(angle) {
        if(angle >= 180) {
            return angle - 180;
        } else {
            return angle + 180;
        }
    }

    function createGuidingLine(axesAngles, R) {
        var zipped = axesAngles.map(function(axisAngle){
            return [axisAngle, R];
        });
        zipped.push(zipped[0]);
        var radialLine = d3.radialLine()
            .angle(function(d) { return d[0]; })
            .radius(function(d) { return d[1]; });
        return radialLine(zipped);
    }
});
