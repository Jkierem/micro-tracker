import { test, expect } from '@playwright/test';
import path from 'path';

test("Can store 100 images", async ({ page }) => {
    const images = 100
    test.setTimeout(Math.max(500_000, 2000 * images));
    await page.goto("/");
    const captureButton = page.getByRole('button', { name: 'Captura' })
    await captureButton.waitFor();
    await captureButton.click();
    for( let i = 0 ; i < images ; i++ ){
        const upload = page.getByRole('button', { name: 'Subir Archivo'})
        const fileChooserPromise = page.waitForEvent('filechooser')
        await upload.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(path.join(import.meta.dirname, 'example.png'))
        await page.locator('canvas').waitFor();
        expect(page.locator('nav')).toBeTruthy();
        await page.getByRole('navigation').locator('div').nth(2).click();
        await page.getByText('Guardar Imagen...').click();
        await page.locator('input').nth(0).fill(`test-${i}`);
        await page.locator('input').nth(1).fill(`test-${i}`);
        await page.getByRole("button", { name: 'Guardar' }).click();
        await page.getByRole('navigation').locator('div').nth(0).click();
        if( (i + 1) % 10 === 0){
            test.info().annotations.push({
                type: "Image Saved",
                description: `Image number ${i} successfuly saved`
            })
        }
    }
    await page.getByRole('navigation').locator('div').nth(1).click();
    const gallery = page.getByRole('button', { name: 'Galeria'});
    await gallery.click();
    await page.getByText(`test-0.png`).waitFor();
    const galleryList = page.getByTestId("gallery");
    await galleryList.waitFor();
    const rows = await galleryList.getByTestId("gallery-row").all();
    expect(rows).toHaveLength(images);
})