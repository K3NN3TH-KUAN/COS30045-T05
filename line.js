document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        const data = await getLineGraphData();
        
        // Sort data by date
        data.sort((a, b) => a.date - b.date);
        
        // Set up dimensions and margins
        const margin = { top: 40, right: 50, bottom: 60, left: 70 };
        const container = document.getElementById('line-graph');
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;
        
        // Create SVG with viewBox for responsiveness
        const svg = d3.select('#line-graph')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Set up scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.price) * 1.1])
            .range([height, 0])
            .nice();
        
        // Add grid lines
        svg.append('g')
            .attr('class', 'grid-lines')
            .selectAll('line')
            .data(yScale.ticks())
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', '#f0f0f0')
            .attr('stroke-width', 1);
        
        // Add X and Y axes
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(data.length/2)
                .tickFormat(d3.timeFormat('%Y')));
        
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-dark)')
            .text('Year');
        
        svg.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-dark)')
            .text('Price ($ per megawatt hour)');
        
        // Create gradient for line
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'line-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0)
            .attr('y1', yScale(d3.min(data, d => d.price)))
            .attr('x2', 0)
            .attr('y2', yScale(d3.max(data, d => d.price)));
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#4cc9f0');
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f72585');
        
        // Add line with animation
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.price))
            .curve(d3.curveMonotoneX);
        
        const path = svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', 'url(#line-gradient)')
            .attr('stroke-width', 3)
            .attr('d', line);
        
        // Animate the line
        const pathLength = path.node().getTotalLength();
        
        path.attr('stroke-dasharray', pathLength)
            .attr('stroke-dashoffset', pathLength)
            .transition()
            .duration(2000)
            .attr('stroke-dashoffset', 0);
        
        // Add area under the line
        const area = d3.area()
            .x(d => xScale(d.date))
            .y0(height)
            .y1(d => yScale(d.price))
            .curve(d3.curveMonotoneX);
        
        svg.append('path')
            .datum(data)
            .attr('fill', 'url(#line-gradient)')
            .attr('fill-opacity', 0.1)
            .attr('d', area);
        
        // Add dots with animation
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.price))
            .attr('r', 0)
            .attr('fill', '#f72585')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .transition()
            .delay((d, i) => i * 150)
            .duration(500)
            .attr('r', 6);
        
        // Add tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        // Add interactivity
        svg.selectAll('.dot')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.html(`
                    <strong>Year: ${d.date.getFullYear()}</strong><br>
                    <span>Price: $${d.price.toFixed(2)} per MWh</span>
                `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 6);
                
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
        //     .text('ARE Spot Prices Over Time');
        
        // Handle window resize
        const resizeChart = () => {
            const newWidth = container.clientWidth - margin.left - margin.right;
            const newHeight = container.clientHeight - margin.top - margin.bottom;
            
            d3.select('#line-graph svg')
                .attr('viewBox', `0 0 ${newWidth + margin.left + margin.right} ${newHeight + margin.top + margin.bottom}`);
        };
        
        window.addEventListener('resize', resizeChart);
        
    } catch (error) {
        console.error('Error creating line graph:', error);
        document.getElementById('line-graph').innerHTML = `
            <div class="error-message">
                <p>Error loading chart: ${error.message}</p>
            </div>
        `;
    }
});