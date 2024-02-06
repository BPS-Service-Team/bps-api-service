require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const {BITBUCKET_WORKSPACE, BITBUCKET_REPO_SLUG, BITBUCKET_PR_ID, BITBUCKET_CLONE_DIR} = process.env;
const [, , reviewUserAuth] = process.argv;

String.prototype.toSnakeCase = function () {
    return this
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_');
};

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) await callback(array[index], index);
};

const btoa = str => Buffer.from(String(str)).toString('base64');

const generateCommentHash = (filePath, lineNumber, errorRawString) => {
    return btoa(filePath.toSnakeCase())
        + '_'
        + btoa(lineNumber)
        + '_'
        + btoa(errorRawString.toSnakeCase());
};

const eslintOutput = JSON
    .parse(
        fs.readFileSync(`${__dirname}/output/output.json`)
    )
    .filter(({messages, filePath}) => {
        return !!messages.length && filePath.indexOf(`${BITBUCKET_CLONE_DIR}/resources`) !== -1;
    })
    .map(({filePath, messages}) => {
        filePath = filePath.substr(filePath.indexOf('/resources/assets') + 1);

        return {
            filePath,
            messages: messages.map(({message, line}) => ({
                message,
                line,
                hash: generateCommentHash(filePath, line, `Eslint: ${message}`)
            }))
        };
    });

const instance = axios.create({
    baseURL: 'https://api.bitbucket.org/2.0/',
    headers: {
        Authorization: `Basic ${reviewUserAuth}`
    }
});

const getComments = (params = {}) => instance.get(`repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/pullrequests/${BITBUCKET_PR_ID}/comments`, {params});

const loadAllCommentsHashes = async () => {
    let comments = [],
        page     = 1;

    while (true) {
        let {data} = await getComments({page});

        comments = comments.concat(data.values);

        if (!data.next) break;

        ++page;
    }

    return comments
        .filter(({inline}) => {
            return typeof inline === 'object'
                && !!inline.path
                && !!inline.to;
        })
        .map(({content, inline: {path, to}}) => {
            return generateCommentHash(path, to, content.raw);
        });
};

const storeComment = data => instance.post(`repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/pullrequests/${BITBUCKET_PR_ID}/comments`, data);

const EXCEPT_MESSAGES = ['clear'];

(async () => {
    try {
        const existsCommentsHashes = await loadAllCommentsHashes();

        await asyncForEach(eslintOutput, async ({filePath, messages}) => {
            await asyncForEach(messages, async ({message, line, hash}) => {
                if (existsCommentsHashes.includes(hash) || EXCEPT_MESSAGES.includes(message)) return;

                await storeComment({
                    inline:  {
                        path: filePath,
                        to:   line
                    },
                    content: {
                        raw: `Eslint: ${message}`
                    }
                });
            });
        });

        console.log('SUCCESS \n');

        eslintOutput.forEach(({filePath, messages}) => {
            console.log(`Filepath: ${filePath}`);

            console.log('Messages: ');

            messages.forEach(({message, line}) => {
                console.log(`Line ${line} \n Message: ${message}`);
            });

            console.log('\n');
        });
    } catch (e) {
        console.log('ERROR \n');

        console.error(e);
    }
})();
