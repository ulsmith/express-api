#!/usr/bin/env node

/**
 * Post-build script to add .js extensions to relative imports in compiled output
 * This is required for Node.js ES modules which require explicit file extensions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	
	// Match relative imports: from './something' or from '../something' or from '../../something'
	// But exclude: from 'path', from 'fs', etc. (node_modules)
	// Also exclude imports that already have .js extension
	const fixed = content.replace(
		/from\s+['"](\.\.*\/[^'"]+?)['"]/g,
		(match, importPath) => {
			// Skip if already has .js extension
			if (importPath.endsWith('.js')) {
				return match;
			}
			return `from '${importPath}.js'`;
		}
	);
	
	if (content !== fixed) {
		fs.writeFileSync(filePath, fixed, 'utf8');
		return true;
	}
	return false;
}

function walkDir(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	
	files.forEach(file => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		
		if (stat.isDirectory()) {
			walkDir(filePath, fileList);
		} else if ((file.endsWith('.js') && !file.endsWith('.d.ts.js')) || file.endsWith('.d.ts')) {
			fileList.push(filePath);
		}
	});
	
	return fileList;
}

const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
	console.log('dist directory does not exist. Skipping import fixes.');
	process.exit(0);
}

const jsFiles = walkDir(distDir);
let fixedCount = 0;

jsFiles.forEach(file => {
	if (fixImportsInFile(file)) {
		fixedCount++;
		console.log(`Fixed imports in: ${path.relative(distDir, file)}`);
	}
});

console.log(`\nFixed imports in ${fixedCount} file(s).`);

