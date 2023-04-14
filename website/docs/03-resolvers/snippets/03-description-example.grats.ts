/** 
// highlight-start
 * A registered user of the system.
// highlight-end
 * @gqlType
 */
class User {
  /** 
  // highlight-start
   * A friendly greeting for the user, intended for 
   * their first visit.
  // highlight-end
   * @gqlField
   */
  hello(args: {
    // highlight-start
    /** The salutation to use */
    // highlight-end
    greeting: string;
  }): string {
    return `${args.greeting} World`;
  }
}
