const fs = require('fs');

function generatePDF(textNodes, pageWidth, pageHeight, numberOfPages) {
    const fontFamilies = Array.from(new Set(textNodes.map(textNode => textNode.fontFamily)))
    const pdfContent = [];
    const fontsEncoder = {}
    let lastRef = 0

    const addLine = (content) => {
        pdfContent.push(content)
    }

    // PDF header
    addLine('%PDF-1.6');
    addLine('');

    // Catalog
    lastRef++
    addLine(`${lastRef} 0 obj`);
    addLine('<<');
    addLine('/Type /Catalog');
    addLine(`/Pages ${numberOfPages + textNodes.length + fontFamilies.length + 2} 0 R`);
    addLine('>>');
    addLine('endobj');
    addLine('');

    // Fonts
    console.log({ fontFamilies })
    let fontRef = 1
    fontFamilies.forEach(fontFamily => {
        lastRef++
        addLine(`${lastRef} 0 obj`);
        addLine('<<');
        addLine('/Type /Font');
        addLine('/Subtype /Type1');
        addLine(`/BaseFont /${fontFamily}`);
        addLine('>>');
        addLine('endobj');
        addLine('');
        fontsEncoder[fontFamily] = {
            ref: lastRef,
            encoded: `F${fontRef}`
        }
        fontRef++
    })
    console.log({ fontsEncoder })

    // Text
    const calculateCenterCoordinates = (textWidth, textHeight) => {
        const centerX = (pageWidth - textWidth) / 2;
        const centerY = (pageHeight - textHeight) / 2;

        // return [0, 0]
        return [centerX, centerY];
    }

    const pagesContent = {}
    textNodes.forEach(textNode => {
        const textWidth = textNode.textContent.length * textNode.fontSize * 0.5;
        const textHeight = textNode.fontSize * 1.15;
        const [centerX, centerY] = calculateCenterCoordinates(textWidth, textHeight)

        lastRef++
        addLine(`${lastRef} 0 obj`)
        addLine("<<")
        addLine("/Length 44")
        addLine(">>")
        addLine("stream")
        addLine("BT")
        addLine(`${textHeight} TL`)
        addLine(`/${fontsEncoder[textNode.fontFamily].encoded} ${textNode.fontSize} Tf`)
        addLine(`0.8 0.9 1 rg`)
        addLine(`0 0 ${pageWidth} ${pageHeight} re`)
        addLine("f")
        addLine(`0.1 0.2 0.5 rg`)
        addLine(`${centerX} ${centerY} Td`)
        addLine(`(${textNode.textContent}) Tj`)
        addLine("ET")
        addLine("endstream")
        addLine("endobj")
        addLine("")
        pagesContent[textNode.pageNumber] = lastRef
    })
    console.log({ pagesContent })

    // Pages
    const pagesContainerRef = lastRef + numberOfPages + 1
    for (let i = 0; i < numberOfPages; i++) {
        lastRef++
        addLine(`${lastRef} 0 obj`)
        addLine("<<")
        addLine("/Type /Page")
        addLine(`/Parent ${pagesContainerRef} 0 R`)
        addLine(`/MediaBox [0 0 ${pageWidth} ${pageHeight}]`)
        addLine("/Resources <<")
        addLine("/Font <<")
        fontFamilies.forEach(fontFamily => {
            addLine(`/${fontsEncoder[fontFamily].encoded} ${fontsEncoder[fontFamily].ref} 0 R`)
        })
        addLine(">>")
        addLine(">>")
        addLine(`/Contents ${pagesContent[`${i + 1}`]} 0 R`)
        addLine(">>")
        addLine("endobj")
        addLine("")
    }

    // Pages Container
    const addPagesRef = () => {
        const result = []
        for (let i = lastRef - numberOfPages; i < lastRef; i++) {
            result.push(`${i} 0 R`)
        }

        return result.join(" ")
    }

    lastRef++
    addLine(`${lastRef} 0 obj`);
    addLine('<<');
    addLine('/Type /Pages');
    addLine(`/Kids [${addPagesRef()}]`);
    addLine(`/Count ${numberOfPages}`);
    addLine('>>');
    addLine('endobj');
    addLine('');

    // Cross-reference table
    const xrefOffset = pdfContent.join('\n').length;
    addLine(`xref`);
    addLine(`0 ${4 + numberOfPages * 2}`);
    addLine(`0000000000 65535 f`);
    for (let i = 1; i <= 3 + numberOfPages * 2; i++) {
        addLine(`${String(xrefOffset + 1 + i * 20).padStart(10, '0')} 00000 n`);
    }

    // Trailer
    addLine(`trailer`);
    addLine(`<< /Size ${4 + numberOfPages * 2}`);
    addLine(`   /Root 1 0 R`);
    addLine(`>>`);
    addLine(`startxref`);
    addLine(`${xrefOffset}`);
    addLine(`%%EOF`);

    return pdfContent.join('\n');
}

// Example usage
const textNodes = [
    { textContent: 'Hello World', fontFamily: 'Helvetica', fontSize: 48, color: [0, 0, 0], pageNumber: 1 },
    { textContent: 'This is Page 2', fontFamily: 'Courier', fontSize: 48, color: [0, 0, 0], pageNumber: 2 }
];
const pdfContent = generatePDF(textNodes, 600, 400, 2);
fs.writeFileSync('new-output.pdf', pdfContent);

// TODO: Measure the height and width of each character
