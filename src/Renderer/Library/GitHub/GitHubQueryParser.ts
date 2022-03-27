import {GitHubQueryType} from '../Type/GitHubQueryType';

class _GitHubQueryParser {
  parse(query: string): {positive: GitHubQueryType; negative: GitHubQueryType} {
    const tokens = this.lexical(query);
    return this.syntax(tokens);
  }

  private syntax(tokens: string[]): {positive: GitHubQueryType; negative: GitHubQueryType} {
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
      involves: [],
      mentions: [],
      teams: [],
      'review-requested': [],
      'reviewed-by': [],
      'project-names': [],
      'project-columns': [],
      'project-fields': [],
      repos: [],
      milestones: [],
      sort: '',
    };
    const negativeTokenMap = JSON.parse(JSON.stringify(positiveTokenMap)) as GitHubQueryType;

    for (const token of tokens) {
      const matched = token.trim().match(/^(-?)([\w\-]+):(.*)/);
      let not: string, key: string, value: string;
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
        case 'involves':  _tokenMap.involves.push(value.toLowerCase()); break;
        case 'mentions':  _tokenMap.mentions.push(value.toLowerCase()); break;
        case 'team':      _tokenMap.teams.push(value.toLowerCase()); break;
        case 'draft':
          if (value === 'true') _tokenMap.is.draft = true;
          if (value === 'false') _tokenMap.is.undraft = true;
          break;
        case 'review-requested':  _tokenMap['review-requested'].push(value.toLowerCase()); break;
        case 'reviewed-by':   _tokenMap['reviewed-by'].push(value.toLowerCase()); break;
        case 'project-name':  _tokenMap['project-names'].push(value.toLowerCase()); break;
        case 'project-column':  _tokenMap['project-columns'].push(value.toLowerCase()); break;
        case 'project-field':  _tokenMap['project-fields'].push(value.toLowerCase()); break;
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

  private lexical(query: string): string[] {
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
