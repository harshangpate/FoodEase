import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

/**
 * Generate a PDF invoice for an order
 * @param {Object} order - The order object from the database
 * @param {Object} user - The user object
 * @param {String} savePath - Directory to save the PDF to
 * @returns {String} - Path to the generated PDF file
 */
export const generateOrderInvoice = async (order, user, savePath = './invoices') => {
    // Create directory if it doesn't exist
    if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
    }

    // Create a new PDF document
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    // Generate a unique filename
    const filename = `invoice-${order._id}-${Date.now()}.pdf`;
    const filePath = path.join(savePath, filename);

    // Pipe the PDF to a file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add FoodEase logo and header
    doc.fontSize(20).text('FoodEase', { align: 'center' });
    doc.fontSize(12).text('ITM (SLS) Baroda University', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Add horizontal line
    doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
    doc.moveDown();

    // Order and customer information
    doc.fontSize(12);
    doc.text(`Invoice Date: ${moment().format('DD/MM/YYYY')}`, { align: 'right' });
    doc.text(`Order ID: ${order._id}`, { align: 'right' });
    doc.text(`Order Date: ${moment(order.createdAt).format('DD/MM/YYYY, h:mm A')}`, { align: 'right' });
    doc.moveDown();

    doc.text('Customer Information:', { continued: true }).fontSize(10);
    doc.moveDown(0.5);
    doc.text(`Name: ${order.address.firstName} ${order.address.lastName}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${order.address.phone}`);
    doc.text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}`);
    doc.moveDown();

    // Order Details
    doc.fontSize(12).text('Order Details:');
    doc.moveDown(0.5);

    // Create table headers
    const tableTop = doc.y;
    const itemX = 50;
    const quantityX = 300;
    const priceX = 350;
    const amountX = 450;

    doc.fontSize(10)
        .text('Item', itemX, tableTop)
        .text('Qty', quantityX, tableTop)
        .text('Price', priceX, tableTop)
        .text('Amount', amountX, tableTop);

    doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
    doc.moveDown();

    // Calculate starting y position for the table body
    let y = doc.y;

    // Add items to the table
    let totalItems = 0;
    let subtotal = 0;

    Object.entries(order.items).forEach(([itemId, details]) => {
        doc.fontSize(10)
            .text(details.name, itemX, y)
            .text(details.quantity.toString(), quantityX, y)
            .text(`₹${details.price.toFixed(2)}`, priceX, y)
            .text(`₹${(details.quantity * details.price).toFixed(2)}`, amountX, y);

        y += 20;
        totalItems += details.quantity;
        subtotal += details.quantity * details.price;

        // Check if we need to add a new page for the next item
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    // Add a line
    doc.moveTo(50, y)
        .lineTo(550, y)
        .stroke();
    
    y += 10;

    // Order summary
    doc.fontSize(10)
        .text('Subtotal:', 350, y)
        .text(`₹${subtotal.toFixed(2)}`, amountX, y);
    y += 15;

    // Add order type information
    let orderTypeDetails = '';
    if (order.orderType === 'rush') {
        orderTypeDetails = '(Rush Order: +₹20.00)';
    } else if (order.orderType === 'scheduled') {
        orderTypeDetails = `(Scheduled for: ${moment(order.scheduledTime).format('DD/MM/YYYY, h:mm A')})`;
    }

    if (orderTypeDetails) {
        doc.text(`Order Type: ${order.orderType} ${orderTypeDetails}`, 350, y);
        y += 15;
        
        if (order.orderType === 'rush') {
            subtotal += 20; // Add rush fee to the total
        }
    }

    // Add promocode discount if applicable
    if (order.promocode) {
        const discountAmount = (subtotal * order.promocode.discountPercentage / 100);
        
        doc.text(`Discount (${order.promocode.discountPercentage}%):`, 350, y)
            .text(`-₹${discountAmount.toFixed(2)}`, amountX, y);
        y += 15;
        
        subtotal -= discountAmount;
    }

    // Add tax (if applicable)
    const tax = 0; // No tax in this case, but could be added in the future
    
    // Total
    doc.fontSize(12)
        .text('Total:', 350, y)
        .text(`₹${subtotal.toFixed(2)}`, amountX, y);
    y += 20;

    // Payment Information
    doc.fontSize(12).text('Payment Information:', 50, y);
    y += 15;
    
    doc.fontSize(10);
    doc.text(`Payment Method: ${order.paymentMethod}`, 50, y);
    y += 15;
    
    if (order.paymentMethod === 'partial') {
        const partialAmount = subtotal * 0.4;
        const remainingAmount = subtotal - partialAmount;
        
        doc.text(`Partial Payment (40%): ₹${partialAmount.toFixed(2)}`, 50, y);
        y += 15;
        doc.text(`Remaining Amount (60%): ₹${remainingAmount.toFixed(2)}`, 50, y);
        y += 15;
    }
    
    doc.text(`Payment Status: ${order.paymentStatus}`, 50, y);
    y += 15;
    
    if (order.paymentReferenceId) {
        doc.text(`Payment Reference ID: ${order.paymentReferenceId}`, 50, y);
        y += 15;
    }

    // Footer
    doc.fontSize(10).text('Thank you for choosing FoodEase!', 50, 700);
    doc.text('For any issues with your order, please contact us at support@foodease.com', 50, 715);

    // Finalize the PDF
    doc.end();

    // Return a Promise that resolves when the PDF is written to disk
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve(filePath);
        });
        stream.on('error', reject);
    });
};

// Export a function to create a monthly expense report
export const generateMonthlyExpenseReport = async (user, orders, month, year, savePath = './reports') => {
    // Create directory if it doesn't exist
    if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
    }

    // Create a new PDF document
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    // Generate a filename
    const monthName = moment().month(month - 1).format('MMMM');
    const filename = `expense-report-${user._id}-${monthName}-${year}.pdf`;
    const filePath = path.join(savePath, filename);

    // Pipe the PDF to a file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add FoodEase logo and header
    doc.fontSize(20).text('FoodEase', { align: 'center' });
    doc.fontSize(12).text('ITM (SLS) Baroda University', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Monthly Expense Report - ${monthName} ${year}`, { align: 'center' });
    doc.moveDown();

    // Add horizontal line
    doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
    doc.moveDown();

    // Customer information
    doc.fontSize(12);
    doc.text(`Report Date: ${moment().format('DD/MM/YYYY')}`, { align: 'right' });
    doc.moveDown();

    doc.text('Customer Information:', { continued: true }).fontSize(10);
    doc.moveDown(0.5);
    doc.text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    if (user.parentEmail) {
        doc.text(`Parent Email: ${user.parentEmail}`);
    }
    doc.moveDown();

    // Summary
    let totalSpent = 0;
    let totalSavings = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
        // Calculate the base total (before discount)
        let orderTotal = Object.values(order.items).reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Add rush fee if applicable
        if (order.orderType === 'rush') {
            orderTotal += 20;
        }
        
        // Calculate savings if promocode was used
        let savings = 0;
        if (order.promocode) {
            savings = orderTotal * (order.promocode.discountPercentage / 100);
            totalSavings += savings;
        }
        
        // Calculate final total
        const finalTotal = orderTotal - savings;
        totalSpent += finalTotal;
    });

    // Add expense summary
    doc.fontSize(12).text('Expense Summary:');
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Spent: ₹${totalSpent.toFixed(2)}`);
    doc.text(`Total Savings: ₹${totalSavings.toFixed(2)}`);
    doc.moveDown();

    // Add detailed order listing
    doc.fontSize(12).text('Order Details:');
    doc.moveDown(0.5);

    // Create table headers
    const tableTop = doc.y;
    const dateX = 50;
    const orderIdX = 150;
    const itemCountX = 320;
    const totalX = 380;
    const savingsX = 450;

    doc.fontSize(10)
        .text('Date', dateX, tableTop)
        .text('Order ID', orderIdX, tableTop)
        .text('Items', itemCountX, tableTop)
        .text('Total', totalX, tableTop)
        .text('Savings', savingsX, tableTop);

    doc.moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
    doc.moveDown();

    // Calculate starting y position for the table body
    let y = doc.y;

    // Add orders to the table
    orders.forEach(order => {
        // Calculate the base total (before discount)
        let orderTotal = Object.values(order.items).reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Add rush fee if applicable
        if (order.orderType === 'rush') {
            orderTotal += 20;
        }
        
        // Calculate savings if promocode was used
        let savings = 0;
        if (order.promocode) {
            savings = orderTotal * (order.promocode.discountPercentage / 100);
        }
        
        // Calculate final total
        const finalTotal = orderTotal - savings;
        
        // Calculate item count
        const itemCount = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0);

        // Add the order to the table
        doc.fontSize(9)
            .text(moment(order.createdAt).format('DD/MM/YYYY'), dateX, y)
            .text(order._id.toString().substring(0, 10) + '...', orderIdX, y)
            .text(itemCount.toString(), itemCountX, y)
            .text(`₹${finalTotal.toFixed(2)}`, totalX, y)
            .text(savings > 0 ? `₹${savings.toFixed(2)}` : '-', savingsX, y);

        y += 20;

        // Check if we need to add a new page for the next item
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    // Add a line
    doc.moveTo(50, y)
        .lineTo(550, y)
        .stroke();
    
    y += 20;

    // Most ordered items
    const itemCounts = {};
    orders.forEach(order => {
        Object.entries(order.items).forEach(([itemId, details]) => {
            if (!itemCounts[details.name]) {
                itemCounts[details.name] = 0;
            }
            itemCounts[details.name] += details.quantity;
        });
    });

    // Sort items by frequency
    const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Get top 5

    if (sortedItems.length > 0) {
        doc.fontSize(12).text('Most Ordered Items:', 50, y);
        y += 15;
        
        sortedItems.forEach(([itemName, count], index) => {
            doc.fontSize(10).text(`${index + 1}. ${itemName} (${count} times)`, 70, y);
            y += 15;
        });
    }

    // Footer
    doc.fontSize(10).text('Thank you for choosing FoodEase!', 50, 700);
    doc.text('This report was automatically generated. For any questions, please contact support@foodease.com', 50, 715);

    // Finalize the PDF
    doc.end();

    // Return a Promise that resolves when the PDF is written to disk
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve(filePath);
        });
        stream.on('error', reject);
    });
};