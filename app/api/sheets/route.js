import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function getDoc() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.error("Error en autenticación o carga de Google Sheet:", error);
    throw new Error("Failed to authenticate with Google Sheets");
  }
}

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const headers = sheet.headerValues;

    const data = rows.map((row, index) => ({
      rowIndex: index,
      ...row.toObject(),
    }));

    return NextResponse.json({ headers, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch data", details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newRowData = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];

    const newRow = await sheet.addRow(newRowData);

    return NextResponse.json({ success: true, row: newRow.toObject() }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to add row", details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { rowIndex, data } = await request.json();

    if (typeof rowIndex !== 'number' || !data) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    if (rowIndex >= rows.length) {
      return NextResponse.json({ error: "Row index out of bounds" }, { status: 404 });
    }

    const rowToUpdate = rows[rowIndex];

    let changed = false;
    for (const header of sheet.headerValues) {
      if (data[header] !== undefined) {
        if (rowToUpdate.get(header) !== data[header]) {
          rowToUpdate.set(header, data[header]);
          changed = true;
        }
      }
    }

    if (changed) {
      await rowToUpdate.save();
    }

    return NextResponse.json({ success: true, updatedRow: rowToUpdate.toObject() });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update row", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { rowIndex } = await request.json();

    if (typeof rowIndex !== 'number') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    if (rowIndex >= rows.length) {
      return NextResponse.json({ error: "Row index out of bounds" }, { status: 404 });
    }

    await rows[rowIndex].delete();

    return NextResponse.json({ success: true, message: "Row deleted" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete row", details: errorMessage }, { status: 500 });
  }
}