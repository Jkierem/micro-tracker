"""
leishmaniasis.giemsa.parasites
Version 1.1

Macrophage detection in Leishmaniasis samples with Giemsa tinction
Analysis model built by _Michael Hernando Contreras Ramirez (contreras.michael@javeriana.edu.co)_ in 2023.
Code cleanup and ALEF adaptation by _Angel David Talero (angelgotalero@outlook.com)_ in 2024.
Adaptation for WebAssembly (through pyodide) by Juan Miguel Gomez 2024
"""

import cv2
import numpy as np
from skimage.measure import shannon_entropy
from skimage.measure import label, regionprops
from skimage.feature import graycomatrix, graycoprops
from scipy.stats import skew, kurtosis
from skimage import measure
from sklearn.cluster import KMeans

import joblib
import logging
import json

logger = logging.getLogger("pyodide")

# Configuration variables
PADDING = 70
SVMB_FILE = __PRETRAINED_PATH__

ELEMENT_NAME = "parasite"
"""
    Name of the element to diagnose
"""


def applyFilling(imagen, padding):
    ''' Padding o relleno de bordes '''

    # Obtener las dimensiones de la imagen
    alto, ancho, _ = imagen.shape

    # Calcular las nuevas dimensiones de la imagen con el relleno
    nuevo_alto = alto + 2 * padding
    nuevo_ancho = ancho + 2 * padding

    # Crear una nueva imagen con el relleno
    imagen_con_relleno = np.zeros((nuevo_alto, nuevo_ancho, 3), dtype=np.uint8)

    # Copiar la imagen original en la nueva imagen con relleno
    imagen_con_relleno[padding:nuevo_alto-padding,
                       padding:nuevo_ancho-padding] = imagen

    # Rellenar los píxeles de borde con el valor promedio de los píxeles vecinos
    for i in range(padding):
        imagen_con_relleno[i, padding:nuevo_ancho -
                           padding] = np.mean(imagen[0, padding:nuevo_ancho-padding], axis=0)
        imagen_con_relleno[nuevo_alto-i-1, padding:nuevo_ancho -
                           padding] = np.mean(imagen[alto-1, padding:nuevo_ancho-padding], axis=0)
        imagen_con_relleno[padding:nuevo_alto-padding,
                           i] = np.mean(imagen[padding:nuevo_alto-padding, 0], axis=0)
        imagen_con_relleno[padding:nuevo_alto-padding, nuevo_ancho-i -
                           1] = np.mean(imagen[padding:nuevo_alto-padding, ancho-1], axis=0)

    # Rellenar las esquinas con el valor promedio de los píxeles vecinos
    imagen_con_relleno[:padding, :padding] = np.mean(
        imagen_con_relleno[padding, padding], axis=0)
    imagen_con_relleno[:padding, nuevo_ancho-padding:] = np.mean(
        imagen_con_relleno[padding, nuevo_ancho-padding-1], axis=0)
    imagen_con_relleno[nuevo_alto-padding:, :padding] = np.mean(
        imagen_con_relleno[nuevo_alto-padding-1, padding], axis=0)
    imagen_con_relleno[nuevo_alto-padding:, nuevo_ancho-padding:] = np.mean(
        imagen_con_relleno[nuevo_alto-padding-1, nuevo_ancho-padding-1], axis=0)

    return imagen_con_relleno


def igmsSimplified(image):
    ''' Funcion de Segmentacion IGMS (Umbral_Optimo) '''

    # Aplicamos un umbral inicial (por ejemplo, la mitad del rango de intensidad para imágenes de 8 bits)
    # CON rgb cv2.THRESH_BINARY / Con Sy H cv2.THRESH_BINARY_INV
    _, binary_img = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)

    # Calculamos las medias de intensidad para los objetos y el fondo de la imagen binarizada
    mean_obj = image[binary_img == 255].mean()
    mean_bg = image[binary_img == 0].mean()

    # Calculamos el umbral como el promedio de mean_obj y mean_bg
    new_threshold = (mean_obj + mean_bg) / 2

    return new_threshold


def eraseExtensiveAreas(imagen_segmentada, area_min=100, area_max=3000, max_eccentricity=0.9):
    ''' Funcion Recortar Objetos Grandes '''

    # Etiquetar la imagen segmentada
    label_img = label(imagen_segmentada)

    # Obtener las propiedades de los objetos
    props = regionprops(label_img)

    # Crear una nueva imagen con el mismo tamaño que la imagen segmentada
    new_img = np.zeros_like(imagen_segmentada)

    # Iterar sobre las propiedades de los objetos
    for prop in props:
        if area_min <= prop.area <= area_max and prop.eccentricity <= max_eccentricity:
            coords = prop.coords

            for coord in coords:
                new_img[coord[0], coord[1]] = 1

    return new_img


def morphologicalFeatures(mask):
    '''Funcion Caracteristicas Morfologicas'''

    # Encuentra contornos
    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Verifica si no hay contornos encontrados
    if not contours:
        return [0] * 13

    c = max(contours, key=cv2.contourArea)

    area = cv2.contourArea(c)
    perimeter = cv2.arcLength(c, True)
    compactness = (perimeter ** 2) / (4 * np.pi * area) if area != 0 else 0
    # Calcular momentos de Hu
    momentos_hu = cv2.HuMoments(cv2.moments(c)).flatten()

    if len(c) < 5:
        return [area, perimeter, compactness, 0, 0, 0, momentos_hu[0], momentos_hu[1], momentos_hu[2], momentos_hu[3], momentos_hu[4], momentos_hu[5], momentos_hu[6]]

    _, (major_axis, minor_axis), angle = cv2.fitEllipse(c)
    elongation = major_axis / minor_axis if minor_axis != 0 else 0

    solidity = cv2.contourArea(c) / cv2.contourArea(cv2.convexHull(c))

    labeled_mask = measure.label(mask)
    region = measure.regionprops(labeled_mask)
    # Encontrar la región con el área más grande
    largest_region = max(region, key=lambda x: x.area)
    eccentricity = largest_region.eccentricity

    return [area, perimeter, compactness, elongation, solidity, eccentricity, momentos_hu[0], momentos_hu[1], momentos_hu[2], momentos_hu[3], momentos_hu[4], momentos_hu[5], momentos_hu[6]]


def extractTextureFeatures(image, mask):
    '''Funcion Caracteristicas Textura'''

    roi = cv2.bitwise_and(image, image, mask=mask)
    # Verifica si la máscara tiene algún objeto
    # Espacio de Color R, G, B
    # R, G, B = cv2.split(np.array(roi))
    # Conversion a escala de grises
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    if not mask.any():
        return 0, 0, 0, 0, 0, 0, 0  # ... y ceros para otros parámetros si los agregas

    glcm = graycomatrix(gray, [1], [0], symmetric=True, normed=True)
    contrast = graycoprops(glcm, 'contrast')[0, 0]
    energy = graycoprops(glcm, 'energy')[0, 0]
    # Calcular características de textura de color
    # contraste = graycoprops(glcm, 'contrast')[0, 0]
    dissimilarity = graycoprops(glcm, 'dissimilarity')[0, 0]
    homogeneity = graycoprops(glcm, 'homogeneity')[0, 0]
    # energia = graycoprops(glcm, 'energy')[0, 0]
    correlation = graycoprops(glcm, 'correlation')[0, 0]
    ASM = graycoprops(glcm, 'ASM')[0, 0]

    # Calcular la entropía
    entropia = shannon_entropy(gray)

    return contrast, energy, dissimilarity, homogeneity, correlation, ASM, entropia


def colorFeatures(image, mask):
    '''Funcion Caracteristicas Color'''

    # Aseguramos que la máscara es booleana
    mask = mask.astype(bool)

    # Verifica si hay algún objeto en la máscara
    if not mask.any():
        # Asumiendo que hay 4 canales de color (mean, std, skewness, kurtosis)
        return [0] * 12

    # Obtenemos los píxeles de interés
    pixels = image[mask]

    mean_color = np.mean(pixels, axis=0)
    std_color = np.std(pixels, axis=0)
    skewness_color = skew(pixels, axis=0)
    kurtosis_color = kurtosis(pixels, axis=0)

    # Puedes añadir aquí más características según tu interés

    return list(mean_color) + list(std_color) + list(skewness_color) + list(kurtosis_color)


def extractAllFeatures(image, mask):
    '''Funcion Extraer Todas las Caracteriticas'''

    # Obtener características morfológicas
    morph_features = morphologicalFeatures(mask)

    # Obtener características de textura
    texture_features = extractTextureFeatures(image, mask)

    # Obtener características de color
    color_feat = colorFeatures(image, mask)

    # Combinar todas las características en una sola lista
    all_features = morph_features + list(texture_features) + color_feat

    return all_features


def extractMeanColor(image, mask):
    '''Funcion extraer valor medio mascara'''

    masked_image = cv2.bitwise_and(image, image, mask=mask)
    mean_color = cv2.mean(masked_image, mask=mask)
    return mean_color


def extractNucleiAndKinetoplast(nucleo_mask, citoplasma_mask):
    '''Extraccion de nucleo y kinetoplasto'''

    contours, _ = cv2.findContours(
        nucleo_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Obtenemos el contorno del citoplasma
    citoplasma_contours, _ = cv2.findContours(
        citoplasma_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(citoplasma_contours) == 0:
        raise ValueError("No se encontró citoplasma")

    # Tomamos el contorno más grande asumiendo que es el contorno del citoplasma
    citoplasma_contour = max(citoplasma_contours, key=cv2.contourArea)

    inside_cytoplasm = []  # Para almacenar los contornos dentro del citoplasma

    for c in contours:
        # Calcula el momento del contorno
        M = cv2.moments(c)

        # Calcula el punto central (centroid) del contorno
        if M["m00"] != 0:  # evita la división por cero
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            continue

        # Verifica si el punto central está dentro del contorno del citoplasma
        if cv2.pointPolygonTest(citoplasma_contour, (cx, cy), False) == 1:
            inside_cytoplasm.append(c)

    # Ahora que tenemos los contornos dentro del citoplasma, podemos filtrar los que representan el núcleo y el kinetoplasto
    # Por simplicidad, aquí vamos a asumir que el contorno más grande dentro del citoplasma es el núcleo y cualquier otro contorno es el kinetoplasto.

    if len(inside_cytoplasm) == 0:
        return None, None

    nucleus = max(inside_cytoplasm, key=cv2.contourArea)
    nucleus_mask = np.zeros_like(nucleo_mask)
    cv2.drawContours(nucleus_mask, [nucleus], -1, (255), thickness=cv2.FILLED)

    kinetoplasto_mask = np.zeros_like(nucleo_mask)
    # for c in inside_cytoplasm:
    #   if np.array_equal(c, nucleus):  # Si es el núcleo, saltar este contorno
    #      continue
    # cv2.drawContours(kinetoplasto_mask, [c], -1, (255), thickness=cv2.FILLED)

    #################
    # Ordena los contornos dentro del citoplasma de mayor a menor según su área
    inside_cytoplasm_sorted = sorted(
        inside_cytoplasm, key=cv2.contourArea, reverse=True)
    # Asegúrate de que hay al menos dos contornos dentro del citoplasma (núcleo y kinetoplasto)
    if len(inside_cytoplasm_sorted) > 1:
        # El segundo contorno más grande debería ser el kinetoplasto
        kinetoplasto_contour = inside_cytoplasm_sorted[1]
        cv2.drawContours(kinetoplasto_mask, [
                         kinetoplasto_contour], -1, (255), thickness=cv2.FILLED)

    return nucleus_mask, kinetoplasto_mask


def segmentAndExtractMasks(imagen):
    '''Extraccion de Mascaras'''

    # Convertir la imagen a un array 2D donde cada fila es un píxel y las columnas son los canales de color
    pixels = imagen.reshape((-1, 3))
    # Convertir a flotantes
    pixels = np.float32(pixels)
    # Definir criterios y aplicar kmeans()
    num_clusters = 3
    kmeans = KMeans(n_clusters=num_clusters, n_init=20)
    kmeans.fit(pixels)
    # Reemplazar cada píxel por su centroide más cercano
    segmented_image = kmeans.cluster_centers_[kmeans.labels_]
    segmented_image = np.uint8(segmented_image.reshape(imagen.shape))
    # Recupera las etiquetas de clúster para cada píxel
    labels = kmeans.labels_
    labels_2D = labels.reshape(imagen.shape[0], imagen.shape[1])
    masks = []
    for i in range(num_clusters):
        # Crear una máscara binaria para el clúster actual
        mask = np.where(labels_2D == i, 255, 0)
        mask = mask.astype(np.uint8)
        masks.append(mask)

    # Asumiendo que tienes tres máscaras: mask1, mask2, mask3 y la imagen original
    mean_color1 = extractMeanColor(imagen, masks[0])
    mean_color2 = extractMeanColor(imagen, masks[1])
    mean_color3 = extractMeanColor(imagen, masks[2])
    # Crear una lista de tuplas [(mean_color, mask), ...]
    clusters = [(mean_color1, masks[0]), (mean_color2,
                                          masks[1]), (mean_color3, masks[2])]
    # Ordenar las tuplas basado en los valores medios de los píxeles
    clusters_sorted = sorted(clusters, key=lambda x: x[0][0])

    # Asignar etiquetas a cada clúster
    nucleo_mask = clusters_sorted[0][1]
    citoplasma_mask = clusters_sorted[1][1]
    fondo_mask = clusters_sorted[2][1]

    return nucleo_mask, citoplasma_mask, fondo_mask


def detectParasites(img, mask, classifier):
    '''Implementacion Deteccion del Parasito Leishmania spp.'''

    imgP = np.copy(img)

    # Suponiendo que la máscara ya ha sido creada previamente
    labeled = label(mask)

    # Obtener propiedades de las regiones
    regions = regionprops(labeled)

    all_features = []  # Lista para guardar todas las características
    centroids = []  # Lista para guardar los centroides de los parásitos

    # Extraer recortes y características
    for region in regions:
        # Coordenadas centrales del recorte
        cy, cx = region.centroid
        centroids.append((cx, cy))

        # Recorte de la imagen
        crop = imgP[int(cy-70):int(cy+70), int(cx-70):int(cx+70)]

        # Verificar si el recorte es válido antes de continuar
        if crop.size == 0:
            logger.info("recorte vacío, omitiendo...")
            continue

        # Aquí asumimos que las funciones 'segment_and_extract_masks' y 'extract_all_features'
        # están definidas previamente y devuelven las características correctas
        nucleo_mask, citoplasma_mask, fondo_mask = segmentAndExtractMasks(
            crop)
        if np.sum(citoplasma_mask) == 0:
            logger.info(
                "no se encontró citoplasma en el recorte actual: pasando al siguiente recorte.")
            continue

        nucleus_mask_F, kinetoplasto_mask = extractNucleiAndKinetoplast(
            nucleo_mask, citoplasma_mask)
        if nucleus_mask_F is None or kinetoplasto_mask is None:
            logger.info(
                "no se pudo extraer el núcleo y el kinetoplasto: pasando al siguiente recorte.")
            continue

        # Extracción de características
        nucleus_all_features = extractAllFeatures(crop, nucleus_mask_F)
        kinetoplasto_all_features = extractAllFeatures(
            crop, kinetoplasto_mask)
        cytoplasm_all_features = extractAllFeatures(crop, citoplasma_mask)

        features_parasite = np.concatenate(
            [nucleus_all_features, kinetoplasto_all_features, cytoplasm_all_features])

        # Verificar la consistencia en la longitud de las características antes de agregarlas
        if not all_features or len(features_parasite) == len(all_features[0]):
            all_features.append(features_parasite)
        else:
            logger.info(
                "longitud de características inconsistente, omitiendo este recorte.")

    # Array with results
    results = []

    # Verificar si se encontraron características antes de predecir
    if all_features:
        all_features = np.array(all_features)

        # Clasificación con SVM
        predictions = classifier.predict(all_features)

        # Mostrar los resultados de los centroides
        for i, pred in enumerate(predictions):
            if pred == 0:
                # Append the centroids
                cX, cY = centroids[i]
                results.append({
                    "x": int(cX - 70),
                    "y": int(cY - 70),
                    "w": 70,
                    "h": 70,
                })

                # Show output image result
                startX = int(cX - 70)
                startY = int(cY - 70)
                endX = int(cX + 70)
                endY = int(cY + 70)
                cv2.rectangle(imgP, (startX, startY),
                              (endX, endY), (0, 255, 0), 2)
    else:
        logger.info(
            "no se encontraron características válidas para la clasificación.")

    return imgP, results  # Devolver la imagen con los parásitos marcados


def analyze(filepath, output=None):
    """
    Start the analysis of an image

    Args:
        filepath (str): Path (can be either absolute or relative) to the image file

    Returns:
        dict[str, list[dict[str, int]]]: A dictionary with each element found and a
        list of tuples with the coordinates of each instance
    """

    # Show current SVMB file
    logger.info(f"current SVMB file is {SVMB_FILE}")

    # Read the image
    imagen = cv2.imread(filepath)

    # Conversion a escala de grises
    img_pad = applyFilling(imagen, PADDING)

    _, _, r = cv2.split(np.array(img_pad))
    optimal_threshold = igmsSimplified(r)

    _, imagen_umbralizada = cv2.threshold(
        r, optimal_threshold, 255, cv2.THRESH_BINARY_INV,)

    newImgSeg = eraseExtensiveAreas(
        imagen_umbralizada, area_min=100, area_max=3000, max_eccentricity=0.9,)

    svmModel = joblib.load(SVMB_FILE)

    # Uso de la función
    out, results = detectParasites(img_pad, newImgSeg, svmModel)

    # Imagen de salida
    if output is not None:
        cv2.imwrite(output, out)

    # 5. Put the element in the dictionary
    return {ELEMENT_NAME: results}

if __name__ == "__main__":
    print(json.dumps(analyze(__INPUT_PATH__)))