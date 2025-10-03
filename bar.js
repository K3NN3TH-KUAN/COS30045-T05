document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        const data = await getBarChartData();
        
        // Sort data by energy consumption
        data.sort((a, b) => a.energyConsumption - b.energyConsumption);
        
        // Set up dimensions and margins
        const margin = { top: 40, right: 30, bottom: 80, left: 70 };
        const container = document.getElementById('bar-chart');
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;
        
        // Create SVG with viewBox for responsiveness
        const svg = d3.select('#bar-chart')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Set up scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.screenType))
            .range([0, width])
            .padding(0.3);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energyConsumption) * 1.1])
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
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(0)')
            .style('text-anchor', 'end')
            .style('font-size', '12px');
        
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('x', width / 2)
            .attr('y', height + 60)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-dark)')
            .text('Screen Type');
        
        svg.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-dark)')
            .text('Energy Consumption (kWh)');
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.screenType))
            .range(['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#7209b7']);
        
        // Add bars with animation
        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.screenType))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', d => colorScale(d.screenType))
            .attr('rx', 4)
            .attr('ry', 4)
            .transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.energyConsumption))
            .attr('height', d => height - yScale(d.energyConsumption));
        
        // Add value labels on top of bars
        svg.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => xScale(d.screenType) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.energyConsumption) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('opacity', 0)
            .text(d => Math.round(d.energyConsumption))
            .transition()
            .duration(800)
            .delay((d, i) => i * 100 + 300)
            .style('opacity', 1);
        
        // Add title
        // svg.append('text')
        //     .attr('class', 'chart-title')
        //     .attr('x', width / 2)
        //     .attr('y', -15)
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', '16px')
        //     .style('font-weight', 'bold')
        //     .text('Energy Consumption for 55-inch TVs by Screen Type');
        
        // Add tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        // Add interactivity
        svg.selectAll('.bar')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.8)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 2);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.html(`
                    <strong>${d.screenType}</strong><br>
                    <span>Energy Consumption: ${d.energyConsumption.toFixed(1)} kWh</span>
                `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke', 'none');
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        
        // Handle window resize
        const resizeChart = () => {
            const newWidth = container.clientWidth - margin.left - margin.right;
            const newHeight = container.clientHeight - margin.top - margin.bottom;
            
            d3.select('#bar-chart svg')
                .attr('viewBox', `0 0 ${newWidth + margin.left + margin.right} ${newHeight + margin.top + margin.bottom}`);
        };
        
        window.addEventListener('resize', resizeChart);
        
    } catch (error) {
        console.error('Error creating bar chart:', error);
        document.getElementById('bar-chart').innerHTML = `
            <div class="error-message">
                <p>Error loading chart: ${error.message}</p>
            </div>
        `;
    }
});