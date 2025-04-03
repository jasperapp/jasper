import {GitHubQueryParser} from '../Library/GitHub/GitHubQueryParser';
import {GitHubQueryType} from '../Library/Type/GitHubQueryType';
import dayjs from 'dayjs';

// ---- filter ----
// number:123 number:456
// is:issue is:pr type:issue type:pr
// is:open is:closed
// is:read is:unread
// is:bookmark is:unbookmark
// is:archived is:unarchived
// is:merged is:unmerged
// is:draft is:undraft
// draft:true draft:false -- githubのクエリに合わせるため
// is:private is:unprivate
// title:foo
// author:foo
// assignee:foo
// involves:foo
// mentions:foo
// team:foo
// review-requested:foo
// reviewed-by:foo
// user:foo org:foo
// repo:foo/bar
// label:foo label:bar
// milestone:foo
// no:label no:milestone no:assignee no:dueon no:project
// have:label have:milestone have:assignee have:dueon have:project
// ---- sort ----
// sort:number
// sort:type
// sort:read
// sort:updated
// sort:created
// sort:closed
// sort:merged
// sort:archived
// sort:bookmark
// sort:author
// sort:user
// sort:repo
// sort:milestone
// sort:dueon
// sort:title
// single syntax `sort:created`
// order syntax  `sort:"created desc"
// multi syntax  `sort:author,created` (multi column sort does not work database index, so slow query)
// full syntax   `sort:"author desc, created asc"`

class _FilterSQLRepo {
  getSQL(filter: string): {filter: string; sort: string} {
    if (!filter) return {filter: '', sort: ''};

    const conditions = [];
    const {positive: positiveMap, negative: negativeMap} = GitHubQueryParser.parse(filter);

    if (positiveMap.sort) {
      const temp = this.buildSortCondition(positiveMap.sort);
      positiveMap.sort = temp.sort;
      if (temp.filter) conditions.push(temp.filter);
    }

    conditions.push(...this.buildPositiveFilterCondition(positiveMap));
    conditions.push(...this.buildNegativeFilterCondition(negativeMap));

    if (positiveMap.keywords.length) {
      const tmp = [];
      for (let keyword of positiveMap.keywords) {
        keyword = keyword.trim();
        if (!keyword) continue;
        tmp.push(`(
          title like "%${keyword}%"
          or body like "%${keyword}%"
          or user like "%${keyword}%"
          or repo like "%${keyword}%"
          or author like "%${keyword}%"
          or assignees like "%${keyword}%"
          or labels like "%${keyword}%"
          or milestone like "%${keyword}%"
          or involves like "%${keyword}%"
          or mentions like "%${keyword}%"
          or review_requested like "%${keyword}%"
          or reviews like "%${keyword}%"
        )`);
      }
      if (tmp.length) {
        const value = tmp.join(' and ');
        conditions.push(`(${value})`);
      }
    }

    return {
      filter: conditions.join(' and '),
      sort: positiveMap.sort
    };
  }

  private buildPositiveFilterCondition(filterMap: GitHubQueryType) {
    const conditions = [];
    if (filterMap.is.issue) conditions.push('type = "issue"');
    if (filterMap.is.pr) conditions.push('type = "pr"');
    if (filterMap.is.open) conditions.push('closed_at is null');
    if (filterMap.is.closed) conditions.push('closed_at is not null');
    if (filterMap.is.read) conditions.push('(read_at is not null and read_at >= updated_at)');
    if (filterMap.is.unread) conditions.push('(read_at is null or read_at < updated_at)');
    if (filterMap.is.bookmark) conditions.push('marked_at is not null');
    if (filterMap.is.unbookmark) conditions.push('marked_at is null');
    if (filterMap.is.archived) conditions.push('archived_at is not null');
    if (filterMap.is.unarchived) conditions.push('archived_at is null');
    if (filterMap.is.merged) conditions.push('merged_at is not null');
    if (filterMap.is.unmerged) conditions.push('merged_at is null');
    if (filterMap.is.draft) conditions.push('draft = 1');
    if (filterMap.is.undraft) conditions.push('draft = 0');
    if (filterMap.is.private) conditions.push('repo_private = 1');
    if (filterMap.is.unprivate) conditions.push('repo_private = 0');

    if (filterMap.no.label) conditions.push('labels is null');
    if (filterMap.no.milestone) conditions.push('milestone is null');
    if (filterMap.no.assignee) conditions.push('assignees is null');
    if (filterMap.no.dueon) conditions.push('due_on is null');
    if (filterMap.no.project) conditions.push('project_names is null');

    if (filterMap.have.label) conditions.push('labels is not null');
    if (filterMap.have.milestone) conditions.push('milestone is not null');
    if (filterMap.have.assignee) conditions.push('assignees is not null');
    if (filterMap.have.dueon) conditions.push('due_on is not null');
    if (filterMap.have.project) conditions.push('project_names is not null');

    if (filterMap.numbers.length) {
      conditions.push(`(number is not null and number in (${filterMap.numbers.join(',')}))`);
    }

    if (filterMap.titles.length) {
      const value = filterMap.titles.map((title) => `title like "${title}"`).join(' and ');
      conditions.push(`(${value})`);
    }

    if (filterMap.authors.length) {
      const value = filterMap.authors.map((author) => `"${author}"`).join(',');
      conditions.push(`(author is not null and lower(author) in (${value}))`);
    }

    if (filterMap.assignees.length) {
      // hack: assignee format
      const value = filterMap.assignees.map((assignee) => `assignees like "%<<<<${assignee}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap.involves.length) {
      // hack: involves format
      const value = filterMap.involves.map(user => `involves like "%<<<<${user}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap.mentions.length) {
      // hack: mentions format
      const value = filterMap.mentions.map(user => `mentions like "%<<<<${user}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap.teams.length) {
      // hack: mentions format
      const value = filterMap.teams.map(user => `mentions like "%<<<<${user}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap['review-requested'].length) {
      // hack: review-requested format
      const value = filterMap['review-requested'].map(user => `review_requested like "%<<<<${user}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap['reviewed-by'].length) {
      // hack: reviews format
      const value = filterMap['reviewed-by'].map(user => `reviews like "%<<<<${user}>>>>%"`).join(' or ');
      conditions.push(`(${value})`);
    }

    if (filterMap.milestones.length) {
      const value = filterMap.milestones.map((milestone) => `"${milestone}"`).join(',');
      conditions.push(`(milestone is not null and lower(milestone) in (${value}))`);
    }

    if (filterMap.users.length) {
      const value = filterMap.users.map((user) => `"${user}"`).join(',');
      conditions.push(`(user is not null and lower(user) in (${value}))`);
    }

    if (filterMap.repos.length) {
      const value = filterMap.repos.map((repo) => `"${repo}"`).join(',');
      conditions.push(`(repo is not null and lower(repo) in (${value}))`);
    }

    if (filterMap.labels.length) {
      // hack: label format
      const value = filterMap.labels.map((label) => {
        const res = this.replaceCurrentDate(label);
        return `labels like "%<<<<${res}>>>>%"`;
      }).join(' and ');
      conditions.push(`(${value})`);
    }

    return conditions;
  }

  private buildNegativeFilterCondition(filterMap: GitHubQueryType) {
    const conditions = [];
    if (filterMap.is.issue) conditions.push('type != "issue"');
    if (filterMap.is.pr) conditions.push('type != "pr"');
    if (filterMap.is.open) conditions.push('closed_at is not null');
    if (filterMap.is.closed) conditions.push('closed_at is null');
    if (filterMap.is.read) conditions.push('(read_at is null or read_at < updated_at)');
    if (filterMap.is.unread) conditions.push('(read_at is not null and read_at >= updated_at)');
    if (filterMap.is.bookmark) conditions.push('marked_at is null');
    if (filterMap.is.unbookmark) conditions.push('marked_at is not null');
    if (filterMap.is.archived) conditions.push('archived_at is null');
    if (filterMap.is.unarchived) conditions.push('archived_at is not null');
    if (filterMap.is.merged) conditions.push('merged_at is null');
    if (filterMap.is.unmerged) conditions.push('merged_at is not null');
    if (filterMap.is.draft) conditions.push('draft = 0');
    if (filterMap.is.undraft) conditions.push('draft = 1');
    if (filterMap.is.private) conditions.push('repo_private = 0');
    if (filterMap.is.unprivate) conditions.push('repo_private = 1');

    if (filterMap.no.label) conditions.push('labels is not null');
    if (filterMap.no.milestone) conditions.push('milestone is not null');
    if (filterMap.no.assignee) conditions.push('assignees is not null');
    if (filterMap.no.dueon) conditions.push('due_on is not null');
    if (filterMap.no.project) conditions.push('project_names is not null');

    if (filterMap.have.label) conditions.push('labels is null');
    if (filterMap.have.milestone) conditions.push('milestone is null');
    if (filterMap.have.assignee) conditions.push('assignees is null');
    if (filterMap.have.dueon) conditions.push('due_on is null');
    if (filterMap.have.project) conditions.push('project_names is null');

    if (filterMap.numbers.length) {
      conditions.push(`number is not null and number not in (${filterMap.numbers.join(',')})`);
    }

    if (filterMap.titles.length) {
      const value = filterMap.titles.map((title) => `title not like "${title}"`).join(' and ');
      conditions.push(`(${value})`);
    }

    if (filterMap.authors.length) {
      const value = filterMap.authors.map((author) => `"${author}"`).join(',');
      conditions.push(`(author is not null and lower(author) not in (${value}))`);
    }

    if (filterMap.assignees.length) {
      // hack: assignee format
      const value = filterMap.assignees.map((assignee) => `assignees not like "%<<<<${assignee}>>>>%"`).join(' and ');
      conditions.push(`(assignees is null or (${value}))`);
    }

    if (filterMap.involves.length) {
      // hack: involves format
      const value = filterMap.involves.map(user => `involves not like "%<<<<${user}>>>>%"`).join(' and ');
      conditions.push(`(involves is null or (${value}))`);
    }

    if (filterMap.mentions.length) {
      // hack: mentions format
      const value = filterMap.mentions.map(user => `mentions not like "%<<<<${user}>>>>%"`).join(' and ');
      conditions.push(`(mentions is null or (${value}))`);
    }

    if (filterMap.teams.length) {
      // hack: mentions format
      const value = filterMap.teams.map(user => `mentions not like "%<<<<${user}>>>>%"`).join(' and ');
      conditions.push(`(mentions is null or (${value}))`);
    }

    if (filterMap['review-requested'].length) {
      // hack: review-requested format
      const value = filterMap['review-requested'].map(user => `review_requested not like "%<<<<${user}>>>>%"`).join(' and ');
      conditions.push(`(review_requested is null or (${value}))`);
    }

    if (filterMap['reviewed-by'].length) {
      // hack: reviews format
      const value = filterMap['reviewed-by'].map(user => `reviews not like "%<<<<${user}>>>>%"`).join(' and ');
      conditions.push(`(reviews is null or (${value}))`);
    }

    if (filterMap.milestones.length) {
      const value = filterMap.milestones.map((milestone) => `"${milestone}"`).join(',');
      conditions.push(`(milestone is not null and lower(milestone) not in (${value}))`);
    }

    if (filterMap.users.length) {
      const value = filterMap.users.map((user) => `"${user}"`).join(',');
      conditions.push(`(user is not null and lower(user) not in (${value}))`);
    }

    if (filterMap.repos.length) {
      const value = filterMap.repos.map((repo) => `"${repo}"`).join(',');
      conditions.push(`(repo is not null and lower(repo) not in (${value}))`);
    }

    if (filterMap.labels.length) {
      // hack: label format
      const value = filterMap.labels.map((label) => {
        const res = this.replaceCurrentDate(label);
        return `labels not like "%<<<<${res}>>>>%"`;
      }).join(' and ');
      conditions.push(`(labels is null or (${value}))`);
    }

    return conditions;

  }

  // sort:number
  // sort:type
  // sort:read
  // sort:updated
  // sort:created
  // sort:closed
  // sort:merged
  // sort:archived
  // sort:bookmark
  // sort:author
  // sort:user
  // sort:repo
  // sort:milestone
  // sort:dueon
  // sort:title
  // value is 'number desc, updated asc'
  private buildSortCondition(value) {
    const conditions = [];
    const filterConditions = [];
    const sortConditions = value.split(',').map((v)=> v.trim());
    for (const sortCondition of sortConditions) {
      let [column, order] = sortCondition.split(/\s+/);
      if (order && order !== 'asc' && order !== 'desc') order = null;

      switch (column) {
        case 'number': conditions.push(`number ${order ? order : 'desc'}`); break;
        case 'type': conditions.push(`type ${order ? order : 'asc'}`); break;
        case 'read': conditions.push(`read_at ${order ? order : 'desc'}`); break;
        case 'updated': conditions.push(`updated_at ${order ? order : 'desc'}`); break;
        case 'created': conditions.push(`created_at ${order ? order : 'desc'}`); break;
        case 'closed': conditions.push(`closed_at ${order ? order : 'desc'}`); break;
        case 'merged': conditions.push(`merged_at ${order ? order : 'desc'}`); break;
        case 'archived': conditions.push(`archived_at ${order ? order : 'desc'}`); break;
        case 'bookmark': conditions.push(`marked_at ${order ? order : 'desc'}`); break;
        case 'author': conditions.push(`author ${order ? order : 'asc'}`); break;
        case 'user': conditions.push(`user ${order ? order : 'asc'}`); break;
        case 'repo': conditions.push(`repo ${order ? order : 'asc'}`); break;
        case 'milestone': conditions.push(`milestone ${order ? order : 'desc'}`); break;
        case 'dueon':
          conditions.push(`due_on ${order ? order : 'asc'}`);
          filterConditions.push('closed_at is null');
          filterConditions.push('due_on is not null');
          break;
        case 'title':
          conditions.push(`title ${order ? order : 'asc'}`);
          break;
      }
    }

    return {
      sort: conditions.join(' , '),
      filter: filterConditions.join(' and ')
    };
  }

  // @current_date, @next_date, @prev_date, @current_date+n, @current_date-n
  private replaceCurrentDate(str: string) {
    return str.replace(/@current_date(?:([+-])(\d+))?/, (_, op, numStr) => {
      const now = dayjs();
      if (['+', '-'].includes(op) && numStr != null) {
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) {
          const aa = op === '+' ? now.add(num, 'day') : now.subtract(num, 'day');
          return aa.format('YYYY%MM%DD');
        }
      }
      return now.format('YYYY%MM%DD');
    }).replace(/@next_date/, () => {
      const now = dayjs();
      return now.add(1, 'day').format('YYYY%MM%DD');
    }).replace(/@prev_date/, () => {
      const now = dayjs();
      return now.subtract(1, 'day').format('YYYY%MM%DD');
    });
  }
}

export const FilterSQLRepo = new _FilterSQLRepo();
