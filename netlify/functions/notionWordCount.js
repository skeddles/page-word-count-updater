require('dotenv').config();
const { Client } = require('@notionhq/client');


const COUNT_FIELD_NAME = 'Word Count';
const COUNT_UPDATED_DATE_FIELD_NAME = 'Word Count Updated';

// Initialize the Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

exports.handler = async function (event, context) {
	try {
		const databaseId = process.env.NOTION_DATABASE_ID;

		console.log('Fetching all entries in the database...');
		// Fetch all entries in the database
		const response = await notion.databases.query({ database_id: databaseId });
		console.log(`Fetched ${response.results.length} entries.`);
		const pages = response.results;

		for (const page of pages) {
			const pageName = page.properties['Name']?.title[0]?.text?.content || ' Page';
			console.log('\n\n', '='.repeat(50));
			console.log(`Processing page: ${pageName}`);
			const lastEditedTime = new Date(page.last_edited_time);
			const pageCountUpdatedField = page.properties[COUNT_UPDATED_DATE_FIELD_NAME]?.date?.start;
			const pageCountUpdated = pageCountUpdatedField ? new Date(pageCountUpdatedField) : new Date(0);

			if (lastEditedTime > pageCountUpdated) {
				console.log(`Page ${pageName} needs an update. Fetching blocks...`);
				console.log(`this is why it needs an update: ${lastEditedTime} > ${pageCountUpdated || new Date(0)}`);

				// Fetch all blocks of the page
				const blocks = await notion.blocks.children.list({ block_id: page.id });
				console.log(`Fetched ${blocks.results.length} blocks for page ${pageName}.`);

				// Inspecting blocks for debugging
				//console.log(`Inspecting blocks for page ${pageName}:`, JSON.stringify(blocks.results, null, 2));

				// Count words in all blocks
				let wordCount = 0;
				// Update to use block.paragraph.rich_text instead of block.paragraph.text
				for (const block of blocks.results) {
					if (block.type === 'paragraph') {
						if (Array.isArray(block.paragraph.rich_text) && block.paragraph.rich_text.length > 0) {
							const blockWordCount = block.paragraph.rich_text.reduce((count, text) => {
								if (text.plain_text) {
									return count + text.plain_text.split(/\s+/).length;
								} else {
									console.warn(`Warning: Missing plain_text in block: ${JSON.stringify(text)}`);
									return count;
								}
							}, 0);
							wordCount += blockWordCount;
							//console.log(`Block word count: ${blockWordCount}, Total word count: ${wordCount}`);
						} else {
							//console.warn(`Warning: Block paragraph rich_text is empty or invalid: ${JSON.stringify(block.paragraph.rich_text)}`);
						}
					} else {
						console.log(`Skipping non-paragraph block of type: ${block.type}`);
					}
				}

				//warning for if page word count is 0
				if (wordCount === 0) console.warn(`Warning: Page ${page.id} has a word count of 0.`);
				

				// Ensure 'Page Count' property exists and has a valid number before accessing it
				const currentPageCount = page.properties[COUNT_FIELD_NAME]?.number;
				if (currentPageCount === undefined) {
					console.warn(`Warning: 'Page Count' property is missing or invalid for page ${page.id}. Defaulting to 0.`);
				}

				// Update the page if the word count has changed
				if (currentPageCount !== wordCount) {
					console.log(`Updating page ${page.id}: Current count = ${currentPageCount}, New count = ${wordCount}`);
					await notion.pages.update({
						page_id: page.id,
						properties: {
							[COUNT_FIELD_NAME]: { number: wordCount },
							[COUNT_UPDATED_DATE_FIELD_NAME]: { date: { start: new Date().toISOString() } },
						},
					});
					console.log(`Page ${pageName} updated successfully.`);
				} else {
					console.log(`Page ${pageName} already has the correct word count.`);
				}
			} else {
				console.log(`Page ${pageName} does not need an update.`);
			}
		}

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Word counts updated successfully.' }),
		};
	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'An error occurred.' }),
		};
	}
};


