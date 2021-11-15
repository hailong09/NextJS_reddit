import { User } from "../entities/User";
import DataLoader from "dataloader";
import { Upvote } from "../entities/Upvote";
interface VoteTypeCondition {
  postId: number;
  userId: number;
}
const batchGetUsers = async (userIds: number[]) => {
  const users = await User.findByIds(userIds);
  return userIds.map((userId) => users.find((user) => user.id === userId));
};

const batchGetVoteTypes = async (voteTypeConditions: VoteTypeCondition[]) => {
  const voteTypes = await Upvote.findByIds(voteTypeConditions);
  return voteTypeConditions.map((voteTypeCondition) =>
    voteTypes.find((voteType) => voteType.postId === voteTypeCondition.postId)
  );
};

export const buildDataLoader = () => ({
  userLoader: new DataLoader<number, User | undefined>((userIds) =>
    batchGetUsers(userIds as number[])
  ),
  voteTypeLoader: new DataLoader<VoteTypeCondition, Upvote | undefined>(
    (voteTypeConditions) =>
      batchGetVoteTypes(voteTypeConditions as VoteTypeCondition[])
  ),
});
