const { Builder, By, Key, until } = require('selenium-webdriver');

// Replace with your local project URL (including port if necessary)
const baseUrl = 'http://localhost:3000/register';

async function testRegister() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // Navigate to the registration page
    await driver.get(baseUrl);

    // Find email input and enter a valid email
    const emailInput = await driver.findElement(By.name="email");
    await emailInput.sendKeys('test@example.com');

    // Find password input and enter a strong password
    const passwordInput = await driver.findElement(By.name="password");
    await passwordInput.sendKeys('StrongPassword123!');

    // Find confirm password input and re-enter the password
    const confirmPasswordInput = await driver.findElement(By.name="confirm_password");
    await confirmPasswordInput.sendKeys('StrongPassword123!');

    // Find the register button and submit the form
    const registerButton = await driver.findElement(By.name="submit");
    await driver.wait(until.elementToBeClickable(registerButton), 5000); // Wait for button to be clickable
    await registerButton.click();

    // **Assuming successful registration redirects to login page**
    // Check if login page title is present (adjust selector as needed)
    const loginTitle = await driver.findElement(By.css('h1')).getText();
    if (loginTitle && loginTitle.includes('Login')) {
      console.log('Registration successful (redirected to login page)');
    } else {
      console.error('Registration failed or did not redirect to login page.');
      // Optionally, capture a screenshot using driver.takeScreenshot()
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
   // await driver.quit();
  }
}

testRegister();
