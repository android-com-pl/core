import app from '../../common/app';
import Model from '../Model';
import computed from '../utils/computed';
import ItemList from '../utils/ItemList';
import Badge from '../components/Badge';
import Mithril from 'mithril';
import Post from './Post';
import User from './User';

export default class Discussion extends Model {
  title() {
    return Model.attribute<string>('title').call(this);
  }
  slug() {
    return Model.attribute<string>('slug').call(this);
  }

  createdAt() {
    return Model.attribute<Date | null, string | null>('createdAt', Model.transformDate).call(this);
  }
  user() {
    return Model.hasOne<User>('user').call(this);
  }
  firstPost() {
    return Model.hasOne<Post>('firstPost').call(this);
  }

  lastPostedAt() {
    return Model.attribute<Date | null, string | null>('lastPostedAt', Model.transformDate).call(this);
  }
  lastPostedUser() {
    return Model.hasOne<User>('lastPostedUser').call(this);
  }
  lastPost() {
    return Model.hasOne<Post>('lastPost').call(this);
  }
  lastPostNumber() {
    return Model.attribute<number | null>('lastPostNumber').call(this);
  }

  commentCount() {
    return Model.attribute<number | null>('commentCount').call(this);
  }
  replyCount() {
    return computed<number, this>('commentCount', (commentCount) => Math.max(0, (commentCount as number) - 1)).call(this);
  }
  posts() {
    return Model.hasMany<Post>('posts').call(this);
  }
  mostRelevantPost() {
    return Model.hasOne<Post>('mostRelevantPost').call(this);
  }

  lastReadAt() {
    return Model.attribute<Date | null, string | null>('lastReadAt', Model.transformDate).call(this);
  }
  lastReadPostNumber() {
    return Model.attribute<number | null>('lastReadPostNumber').call(this);
  }
  isUnread() {
    return computed<boolean, this>('unreadCount', (unreadCount) => !!unreadCount).call(this);
  }
  isRead() {
    return computed<boolean, this>('unreadCount', (unreadCount) => app.session.user && !unreadCount).call(this);
  }

  hiddenAt() {
    return Model.attribute<Date | null, string | null>('hiddenAt', Model.transformDate).call(this);
  }
  hiddenUser() {
    return Model.hasOne<User>('hiddenUser').call(this);
  }
  isHidden() {
    return computed<boolean, this>('hiddenAt', (hiddenAt) => !!hiddenAt).call(this);
  }

  canReply() {
    return Model.attribute<boolean | null>('canReply').call(this);
  }
  canRename() {
    return Model.attribute<boolean | null>('canRename').call(this);
  }
  canHide() {
    return Model.attribute<boolean | null>('canHide').call(this);
  }
  canDelete() {
    return Model.attribute<boolean | null>('canDelete').call(this);
  }

  /**
   * Remove a post from the discussion's posts relationship.
   */
  removePost(id: string): void {
    const posts = this.rawRelationship<Post[]>('posts');

    if (!posts) {
      return;
    }

    posts.some((data, i) => {
      if (id === data.id) {
        posts.splice(i, 1);
        return true;
      }

      return false;
    });
  }

  /**
   * Get the estimated number of unread posts in this discussion for the current
   * user.
   */
  unreadCount(): number {
    const user = app.session.user;

    if (user && user.markedAllAsReadAt().getTime() < this.lastPostedAt()?.getTime()!) {
      const unreadCount = Math.max(0, (this.lastPostNumber() ?? 0) - (this.lastReadPostNumber() || 0));
      // If posts have been deleted, it's possible that the unread count could exceed the
      // actual post count. As such, we take the min of the two to ensure this isn't an issue.
      return Math.min(unreadCount, this.commentCount() ?? 0);
    }

    return 0;
  }

  /**
   * Get the Badge components that apply to this discussion.
   */
  badges(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();

    if (this.isHidden()) {
      items.add('hidden', Badge.component({ type: 'hidden', icon: 'fas fa-trash', label: app.translator.trans('core.lib.badge.hidden_tooltip') }));
    }

    return items;
  }

  /**
   * Get a list of all of the post IDs in this discussion.
   */
  postIds(): string[] {
    return this.rawRelationship<Post[]>('posts')?.map((link) => link.id) ?? [];
  }
}
