#!/usr/bin/env node

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

function blocks(markdown) {
 return markdown.split(/\r?\n/).map((line)=>{const heading=line.match(/^(#{1,4})\s+(.+)/);if(heading)return{type:'heading',level:heading[1].length,text:heading[2]};if(/^[-*]\s+/.test(line))return{type:'bullet',text:line.replace(/^[-*]\s+/,'')};if(/^\|/.test(line))return{type:'table',text:line.replace(/^\||\|$/g,'').split('|').map((x)=>x.trim()).join('  |  ')};return{type:'text',text:line};});
}

export async function exportProposal(input, options={}) {
 const source=resolve(input); if(!existsSync(source))throw new Error(`Proposal Markdown not found: ${source}`);
 const markdown=readFileSync(source,'utf8'); const outputRoot=resolve(options.outputRoot??dirname(source));mkdirSync(outputRoot,{recursive:true});
 const stem=basename(source,extname(source)); const pdfPath=join(outputRoot,`${stem}.pdf`); const docxPath=join(outputRoot,`${stem}.docx`); const parsed=blocks(markdown);
 if(options.pdf!==false) await new Promise((accept,reject)=>{const doc=new PDFDocument({size:'LETTER',margins:{top:54,bottom:54,left:54,right:54},info:{Title:stem,Author:options.author??'consulting-ops'}});const stream=createWriteStream(pdfPath);doc.pipe(stream);doc.fontSize(9).fillColor('#9b1c1c').text('DRAFT — HUMAN REVIEW REQUIRED',{align:'right'}).moveDown();for(const item of parsed){if(item.type==='heading'){doc.moveDown(item.level===1?0.8:0.4).font('Helvetica-Bold').fontSize(item.level===1?20:item.level===2?15:12).fillColor('#18392b').text(item.text).font('Helvetica').fillColor('#111').fontSize(10).moveDown(0.3)}else if(item.type==='bullet'){doc.text(`• ${item.text}`,{indent:14,paragraphGap:4})}else if(item.type==='table'){doc.font('Courier').fontSize(8).text(item.text).font('Helvetica').fontSize(10)}else if(item.text){doc.text(item.text,{paragraphGap:6})}else doc.moveDown(0.4)}doc.end();stream.on('finish',accept);stream.on('error',reject)});
 if(options.docx!==false){const children=[new Paragraph({children:[new TextRun({text:'DRAFT — HUMAN REVIEW REQUIRED',bold:true,color:'9B1C1C'})]})];for(const item of parsed){if(item.type==='heading')children.push(new Paragraph({text:item.text,heading:item.level===1?HeadingLevel.TITLE:item.level===2?HeadingLevel.HEADING_1:item.level===3?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3}));else if(item.type==='bullet')children.push(new Paragraph({text:item.text,bullet:{level:0}}));else children.push(new Paragraph({text:item.text||''}))}const document=new Document({sections:[{children}]});writeFileSync(docxPath,await Packer.toBuffer(document));}
 return {source,pdf:options.pdf===false?null:pdfPath,docx:options.docx===false?null:docxPath,draft:true};
}
async function main(){const args=process.argv.slice(2);const input=args.find((arg)=>!arg.startsWith('--'));if(!input||args.includes('--help')){console.log('Usage: node export-proposal.mjs <proposal.md> [--out folder] [--pdf-only|--docx-only]');process.exit(input?0:1)}const index=args.indexOf('--out');console.log(JSON.stringify(await exportProposal(input,{outputRoot:index>=0?args[index+1]:undefined,pdf:!args.includes('--docx-only'),docx:!args.includes('--pdf-only')}),null,2));}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch((error)=>{console.error(error.message);process.exit(1)});
