const { Builder, By, Key, until } = require('selenium-webdriver');
require('chromedriver'); // Ensure chromedriver is installed

(async function runStockListTests() {
    // Initialize the WebDriver
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        // Log in
        await driver.get('http://localhost:3000/login');
        await driver.findElement(By.name('username')).sendKeys('user@gmail.com');
        await driver.findElement(By.name('password')).sendKeys('123456');
        await driver.findElement(By.name('submit')).click();

        // Wait for redirection to the stock list page
        await driver.wait(until.urlIs('http://localhost:3000/stocklist'), 10000);

        // Verify redirection to the stock list page
        let currentUrl = await driver.getCurrentUrl();
        if (currentUrl !== 'http://localhost:3000/stocklist') {
            console.log('Login failed. Current URL:', currentUrl);
            return;
        }
        console.log('Login successful!');

        // Sort stocks by price (Low to High)
        await driver.findElement(By.css('select')).sendKeys('price-asc');
        await driver.sleep(2000); // Wait for stocks to sort

        // Add a stock to favorites
        let addToFavoritesButton = await driver.findElement(By.css('.card-buttons button:nth-of-type(1)'));
        await addToFavoritesButton.click();
        await driver.sleep(2000); // Wait for the action to complete

        // Add a stock to compare list
        let addToCompareButton = await driver.findElement(By.css('.card-buttons button:nth-of-type(2)'));
        await addToCompareButton.click();
        await driver.sleep(2000); // Wait for the action to complete

        // Verify stock is added to compare list
        let compareTable = await driver.findElement(By.css('.comparison-table'));
        let rows = await compareTable.findElements(By.css('tbody tr'));
        if (rows.length > 0) {
            console.log('Stock successfully added to compare list!');
        } else {
            console.log('Failed to add stock to compare list.');
        }

    } catch (error) {
        console.error('Error during stock list testing:', error);
    } finally {
        // Quit the WebDriver session
        //await driver.quit();
    }
})();
