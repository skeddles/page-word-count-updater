# Notion Word Count Updater

This is a Netlify serverless function that updates the word count of all the pages in a Notion database. It uses the Notion API to fetch the pages and update their word count.

## Setup

1. Add a column to your Notion database called `Word Count` with the type `Number`.
2. Add another column to your Notion database called `Word Count Updated` with the type `Date`.
3. create a new Notion integration for your workspace and get the API key https://www.notion.so/profile/integrations
4. Open the database in notion and click `...` then `connections` and select the integration you created in step 1.
5. Get the ID of your database form the url by clicking `Copy URL`. The URL will look like this: `https://www.notion.so/your-workspace/your-database-id?v=your-view-id`. The database ID is the part after your workspace name and before the `?` or `#`.
6. Copy the api key from from step 1 and the database ID from step 3 into a `.env` file in the root of the project. The file should look like this:

- ```NOTION_API_KEY=<paste your Notion API key here>```
- ```NOTION_DATABASE_ID=<paste your Notion database ID here>```

7. In Netflify click `Add new project` and select `Import an existing project`.

## Development

1. Clone the repository to your local machine.
2. Install the dependencies by running `npm install`.
3. Install the Netlify CLI by running `npm install -g netlify-cli`.
4. Run netlify with `npm run start-netlify`
5. Run the function with `npm run test-function`