export interface HotspotItem {
  id: number;
  标题: string;
  内容: string;
  发布时间: string;
  情感打分: number;
  行业名称: string;
  概念名称: string;
  标的名称?: string;
  标的代码?: string;
  是否重复: boolean;
  来源: string;
}

export interface SourceSubCategory {
  label: string;
}

export interface SourceCategory {
  label: string;
  children: string[];
}

export type HotspotSource = '全部' | '同花顺' | '华尔街见闻' | '财新网';

export const SOURCE_TREE: SourceCategory[] = [
  { label: '政策法规', children: ['新闻联播', '政策长篇'] },
  { label: '新闻资讯', children: ['新闻快讯', '新闻通讯'] },
  { label: '研报公告', children: ['券商研报', '上市公告'] },
  { label: '互动问答', children: ['上证e', '深圳e'] },
];

export const ALL_SOURCES = SOURCE_TREE.flatMap((cat) => cat.children);