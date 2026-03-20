/**
 * src/reports/chartRenderer.js
 *
 * Server-side chart rendering using chartjs-node-canvas.
 * Returns PNG Buffer objects for embedding in email as CID attachments.
 */

'use strict';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const WIDTH = 600;
const HEIGHT = 300;

const renderer = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: '#ffffff',
});

/**
 * Render a bar chart of daily/aggregated revenue for the past month.
 *
 * @param {Array<{ date: string, revenue: number }>} data
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function renderRevenueChart(data) {
    const labels = data.map((d) => d.date);
    const values = data.map((d) => d.revenue);

    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Daily Revenue (PKR)',
                    data: values,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#4F46E5',
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Monthly Revenue Trend',
                    font: { size: 16, weight: 'bold' },
                    color: '#1F2937',
                },
            },
            scales: {
                x: {
                    ticks: { maxRotation: 45, color: '#6B7280' },
                    grid: { display: false },
                },
                y: {
                    ticks: { color: '#6B7280' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'PKR', color: '#6B7280' },
                },
            },
        },
    };

    return renderer.renderToBuffer(config);
}

/**
 * Render a grouped bar chart of material kg deposited vs. processed.
 *
 * @param {Array<{ material: string, depositedKg: number, processedKg: number }>} data
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function renderThroughputChart(data) {
    const labels = data.map((d) => d.material);
    const deposited = data.map((d) => d.depositedKg);
    const processed = data.map((d) => d.processedKg);

    const config = {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Deposited (kg)',
                    data: deposited,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Processed / Withdrawn (kg)',
                    data: processed,
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Material Throughput by Type',
                    font: { size: 16, weight: 'bold' },
                    color: '#1F2937',
                },
            },
            scales: {
                x: {
                    ticks: { color: '#6B7280' },
                    grid: { display: false },
                },
                y: {
                    ticks: { color: '#6B7280' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'Kilograms (kg)', color: '#6B7280' },
                },
            },
        },
    };

    return renderer.renderToBuffer(config);
}

module.exports = { renderRevenueChart, renderThroughputChart };
