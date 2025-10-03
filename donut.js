document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        const rawData = await getDonutChartData();
        
        // Process data for the donut chart - aggregate by screen type
        const screenTypes = {};
        rawData.forEach(d => {
            if (screenTypes[d.screenType]) {
                screenTypes[d.screenType] += d.energyConsumption;
            } else {
                screenTypes[d.screenType] = d.energyConsumption;
            }
        });
        
        const data = Object.entries(screenTypes).map(([key, value]) => ({
            screenType: key,
            energyConsumption: value
        }));
        
        // Set up dimensions and margins
        const margin = { top: 40, right: 30, bottom: 30, left: 30 };
        const container = document.getElementById('donut-chart');
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;
        const radius = Math.min(width, height) / 2;
        
        // Create SVG with viewBox for responsiveness
        const svg = d3.select('#donut-chart')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);
        
        // Set up color scale
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.screenType))
            .range(['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#7209b7', '#560bad', '#480ca8']);
        
        // Set up pie and arc generators
        const pie = d3.pie()
            .value(d => d.energyConsumption)
            .sort(null);
        
        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius * 0.8)
            .cornerRadius(4)
            .padAngle(0.02);
        
        const outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);
        
        // Add donut segments with transitions
        const arcs = svg.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');
        
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.screenType))
            .attr('stroke', 'white')
            .style('stroke-width', '2px')
            .style('opacity', 0.9)
            .transition()
            .duration(1000)
            .attrTween('d', function(d) {
                const i = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                return function(t) { return arc(i(t)); };
            });
        
        // Add percentage labels
        const total = d3.sum(data, d => d.energyConsumption);
        
        arcs.append('text')
            .attr('transform', d => {
                const pos = arc.centroid(d);
                return `translate(${pos[0]}, ${pos[1]})`;
            })
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => {
                const percent = (d.data.energyConsumption / total * 100).toFixed(1);
                return percent > 5 ? `${percent}%` : '';
            });
        
        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${radius + 20}, ${-radius + 20})`);
        
        data.forEach((d, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);
            
            legendRow.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', colorScale(d.screenType));
            
            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .text(`${d.screenType}`);
        });
        
        // Add title
        // svg.append('text')
        //     .attr('class', 'chart-title')
        //     .attr('x', 0)
        //     .attr('y', -radius - 10)
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', '16px')
        //     .style('font-weight', 'bold')
        //     .text('Energy Consumption by Screen Type');
        
        // Add tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        arcs.on('mouseover', function(event, d) {
            d3.select(this)
                .style('opacity', 1)
                .transition()
                .duration(200)
                .attr('transform', function() {
                    const centroid = arc.centroid(d);
                    return `translate(${centroid[0] * 0.1}, ${centroid[1] * 0.1})`;
                });
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            const percent = (d.data.energyConsumption / total * 100).toFixed(1);
            tooltip.html(`
                <strong>${d.data.screenType}</strong><br>
                <span>Energy: ${Math.round(d.data.energyConsumption)} kWh</span><br>
                <span>Percentage: ${percent}%</span>
            `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('opacity', 0.9)
                .transition()
                .duration(200)
                .attr('transform', 'translate(0, 0)');
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
        
        // Handle window resize
        const resizeChart = () => {
            const newWidth = container.clientWidth - margin.left - margin.right;
            const newHeight = container.clientHeight - margin.top - margin.bottom;
            
            d3.select('#donut-chart svg')
                .attr('viewBox', `0 0 ${newWidth + margin.left + margin.right} ${newHeight + margin.top + margin.bottom}`);
        };
        
        window.addEventListener('resize', resizeChart);
        
    } catch (error) {
        console.error('Error creating donut chart:', error);
        document.getElementById('donut-chart').innerHTML = `
            <div class="error-message">
                <p>Error loading chart: ${error.message}</p>
            </div>
        `;
    }
});