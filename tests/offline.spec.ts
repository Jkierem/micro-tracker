import { test, expect } from '@playwright/test';
import path from 'path';

test("Offline works", async ({ page, context, baseURL }) => {
    test.setTimeout(200_000);
    await page.goto("/");
    const swURL = await page.evaluate(async () => {
        const registration = await window.navigator.serviceWorker.ready;
        return registration.active?.scriptURL;
    });
    expect(swURL).toBe(`${baseURL}/sw.js`);
    await context.setOffline(true);

    const captureButton = page.getByRole('button', { name: 'Captura' })
    await captureButton.waitFor();
    await captureButton.click();

    const upload = page.getByRole('button', { name: 'Subir Archivo'})
    const fileChooserPromise = page.waitForEvent('filechooser')
    await upload.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(import.meta.dirname, 'example.png'))
    await page.locator('canvas').waitFor();
    expect(page.locator('nav')).toBeTruthy();
    await page.getByRole('navigation').locator('div').nth(2).click();
    await page.getByText('Guardar Imagen...').click();
    await page.locator('input').nth(0).fill("test");
    await page.locator('input').nth(1).fill("test");
    await page.getByRole("button", { name: 'Guardar' }).click();
    await page.getByRole('navigation').locator('div').nth(2).click();
    await page.getByText('Procesar').click();
    await page.getByRole("button", { name: 'Ok' }).click();
    await page.getByRole('navigation').locator('div').nth(1).click();
    await page.getByRole('button', { name: "Reportes" }).click();
    await page.getByText('Running').click();
    await page.getByText("Finished").waitFor()
    await expect(page.getByText("Macrofagos")).toBeVisible();
})