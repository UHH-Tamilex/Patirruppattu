const latestCommits = () => {
    const loc = window.location;
    const span = document.getElementById('latestcommit');
    if(span && loc.hostname.endsWith('.github.io')) {
        const sub = loc.hostname.split('.',1)[0];
        const pathsplit = loc.pathname.split('/');
        pathsplit.shift(); // pathname starts with a slash
        const repo = pathsplit.shift();
        const path = pathsplit.join('/');
        const apiurl = `https://api.github.com/repos/${sub}/${repo}/commits?path=${path}`;
        fetch(apiurl)
            .then((resp) => {
                if(resp.ok)
                    return resp.json();
            })
            .then((data) => {
                if(data) {
                    const date = new Date(data[0].commit.committer.date);
                    const datestr = date.toLocaleString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    span.innerHTML = `Last updated <a href="${data[0].html_url}">${datestr}</a>.`;
                }
            });
    }
};

const GitHubFunctions = {
    latestCommits: latestCommits
};

export { GitHubFunctions };
