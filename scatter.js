document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load and process data
        const data = await getScatterPlotData();
        
        // Set up dimensions and margins with responsive design
        const margin = { top: 40, right: 30, bottom: 60, left: 70 };
        const container = document.getElementById('scatter-plot');
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;
        
        // Create SVG with viewBox for responsiveness
        const svg = d3.select('#scatter-plot')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Set up scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.starRating) * 1.05])
            .range([0, width])
            .nice();
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energyConsumption) * 1.05])
            .range([height, 0])
            .nice();
        
        // Add X and Y axes with labels
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .call(g => g.select('.domain').attr('stroke', '#ccc'))
            .call(g => g.selectAll('.tick line').attr('stroke', '#ccc'));
        
        svg.append('text')
            .attr('class', 'x-label')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .text('Star Rating');
        
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .call(g => g.select('.domain').attr('stroke', '#ccc'))
            .call(g => g.selectAll('.tick line').attr('stroke', '#ccc'));
        
        svg.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .text('Energy Consumption (kWh)');
        
        // // Add grid lines
        // svg.append('g')
        //     .attr('class', 'grid-lines')
        //     .selectAll('line')
        //     .data(xScale.ticks())
        //     .enter()
        //     .append('line')
        //     .attr('x1', d => xScale(d))
        //     .attr('x2', d => xScale(d))
        //     .attr('y1', 0)
        //     .attr('y2', height)
        //     .attr('stroke', '#f0f0f0')
        //     .attr('stroke-width', 1);
        
        // svg.append('g')
        //     .attr('class', 'grid-lines')
        //     .selectAll('line')
        //     .data(yScale.ticks())
        //     .enter()
        //     .append('line')
        //     .attr('x1', 0)
        //     .attr('x2', width)
        //     .attr('y1', d => yScale(d))
        //     .attr('y2', d => yScale(d))
        //     .attr('stroke', '#f0f0f0')
        //     .attr('stroke-width', 1);
        
        // Add scatter points - simplified with uniform color
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.starRating))
            .attr('cy', d => yScale(d.energyConsumption))
            .attr('r', 2)
            .attr('fill', '#4682b4')  // Single color (steel blue)
            .attr('opacity', 0.7)
            .attr('stroke', '#2b506e')  // Darker border
            .attr('stroke-width', 1);
        
        // Add simple tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        svg.selectAll('circle')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('r', 2)
                    .attr('opacity', 1);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.html(`
                    <span>Star Rating: ${d.starRating}</span><br>
                    <span>Energy: ${d.energyConsumption} kWh</span>
                `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('r', 2)
                    .attr('opacity', 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Add title
        // svg.append('text')
        //     .attr('class', 'chart-title')
        //     .attr('x', width / 2)
        //     .attr('y', -15)
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', '16px')
        //     .style('font-weight', 'bold')
        //     .text('Energy Consumption vs Star Rating');
            
        // Handle window resize
        const resizeChart = () => {
            // Update dimensions
            const newWidth = container.clientWidth - margin.left - margin.right;
            const newHeight = container.clientHeight - margin.top - margin.bottom;
            
            // Update viewBox
            d3.select('#scatter-plot svg')
                .attr('viewBox', `0 0 ${newWidth + margin.left + margin.right} ${newHeight + margin.top + margin.bottom}`);
        };
        
        window.addEventListener('resize', resizeChart);
        
    } catch (error) {
        console.error('Error creating scatter plot:', error);
        document.getElementById('scatter-plot').innerHTML = `
            <div class="error-message">
                <p>Error loading chart: ${error.message}</p>
            </div>
        `;
    }
});