import { test, expect } from '@playwright/test';
import path from 'path';

test("Offline works", async ({ page, context }) => {
    test.setTimeout(200_000);
    await page.goto("/");
    await page.waitForEvent('console', {
        predicate: (message) => message.text().startsWith("Loaded")
    })
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