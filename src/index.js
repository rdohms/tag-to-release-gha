import { setFailed, getInput, info } from '@actions/core';
import { context, getOctokit } from '@actions/github';

function configureGithubClient() {
    const ghToken = getInput('token');
    return getOctokit(ghToken)
}

async function run() {
    try {
        const api = configureGithubClient();
        const { ref: tagName, ref_type: refType, repository } = context.payload;
        
        if (refType !== 'tag') {
            return;
        }

        const tags = await api.git.listMatchingRefs({ owner: repository.owner, repo: repository.name, ref: `tags/${tagName}` });
        const tagInfo = await api.git.getTag({ owner: repository.owner, repo: repository.name, tag_sha: tags[0].object.sha });

        info(`Found tag ${tagName} from ${tagInfo.tagger.name}`);
        info(tagInfo.message);

        const release = await api.repos.createRelease({
            owner: repository.owner,
            repo: repository.name,
            tag_name: tagName,
            name: tagName,
            body: tagInfo.message.replace(`\n${tagInfo.verification.signature}`, ''),
        });

        info(`Release ${release.name} created at ${release.url}`)

    } catch (error) {
      setFailed(error.message);
    }
  }
  
  run();
  