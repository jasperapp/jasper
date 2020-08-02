import {GitHubQueryType} from '../Type/GitHubQueryType';

class _GitHubQueryParser {
  parse(query): {positive: GitHubQueryType; negative: GitHubQueryType} {
    const tokens = this._lexical(query);
    return this._syntax(tokens);
  }

  takeMismatchIssues(query, issues) {
    // todo: check with negativeMap
    const {positive: positiveMap} = this.parse(query);
    const mismatchIssues = [];
    for (const issue of issues) {

      if (positiveMap.is.open) {
        if (issue.closed_at) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.is.closed) {
        if (issue.closed_at === null) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.assignees.length) {
        let names = [];
        if (issue.assignees) {
          names = issue.assignees.map((assignee) => assignee.login.toLowerCase());
        } else if (issue.assignee) {
          names = [issue.assignee.login.toLowerCase()];
        }

        const res = positiveMap.assignees.some((assignee) => names.includes(assignee));
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.labels.length) {
        const names = issue.labels.map((label) => label.name.toLowerCase());
        const res = positiveMap.labels.every((label) => names.includes(label));
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.milestones.length) {
        const res = positiveMap.milestones.some((milestone) => issue.milestone && issue.milestone.title.toLowerCase() === milestone);
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }
    }

    return mismatchIssues;
  }

  _syntax(tokens): {positive: GitHubQueryType; negative: GitHubQueryType} {
    const positiveTokenMap: GitHubQueryType = {
      keywords: [],
      numbers: [],
      is: {},
      labels: [],
      no: {},
      have: {},
      authors: [],
      assignees: [],
      users: [],
      repos: [],
      milestones: [],
      sort: '',
    };
    const negativeTokenMap = JSON.parse(JSON.stringify(positiveTokenMap));

    for (const token of tokens) {
      const matched = token.match(/(-?)(\w+):(.*)/);
      let not, key, value;
      if (matched) {
        not = matched[1];
        key = matched[2];
        value = matched[3];
      } else {
        value = token;
      }

      const _tokenMap = not ? negativeTokenMap : positiveTokenMap;

      switch (key) {
        case 'number':    _tokenMap.numbers.push(value); break;
        case 'is':        _tokenMap.is[value] = true; break;
        case 'type':      _tokenMap.is[value] = true; break;
        case 'author':    _tokenMap.authors.push(value.toLowerCase()); break;
        case 'assignee':  _tokenMap.assignees.push(value.toLowerCase()); break;
        case 'user':      _tokenMap.users.push(value.toLowerCase()); break;
        case 'org':       _tokenMap.users.push(value.toLowerCase()); break;
        case 'repo':      _tokenMap.repos.push(value.toLowerCase()); break;
        case 'label':     _tokenMap.labels.push(value.toLowerCase()); break;
        case 'milestone': _tokenMap.milestones.push(value.toLowerCase()); break;
        case 'no':        _tokenMap.no[value] = true; break;
        case 'have':      _tokenMap.have[value] = true; break;
        case 'sort':      _tokenMap.sort = value; break;
        default:
          if (key && value) {
            _tokenMap[key] = _tokenMap[key] || [];
            _tokenMap[key].push(value);
          } else {
            positiveTokenMap.keywords.push(value.toLowerCase());
          }
      }
    }

    return {positive: positiveTokenMap, negative: negativeTokenMap};
  }

  _lexical(query) {
    const results = [];
    let str = [];
    let state = 'normal';
    for (const c of query.trim()) {
      if (state === 'normal' && c === '"') {
        state = 'phrase';
        continue;
      }

      if (state === 'phrase' && c === '"') {
        state = 'normal';
        continue;
      }

      if (c === ' ' && state === 'normal') {
        results.push(str.join(''));
        str = [];
        continue;
      }

      str.push(c);
    }

    results.push(str.join(''));

    return results;
  }
}

export const GitHubQueryParser = new _GitHubQueryParser();
