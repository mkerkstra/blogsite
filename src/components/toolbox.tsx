import {Link} from '@chakra-ui/react';
import {Table, Tr,
  Thead, Th,
  Tbody, Td,
} from '@chakra-ui/react';
import {myToolbox} from '../data/myToolbox';

const classNames = {
  table: `rounded outline outline-offset-2 outline-2 my-4`,
} as const;

/**
 * @param {args} args - An array of soft and technical tools I consider vital to my job performance.
 * @return {JSX.Element} a section summarizing my development toolbox.
 */
export const Toolbox = (): JSX.Element => {
  const softSkillsRows: JSX.Element[] =[];
  const technicalSkillsRows: JSX.Element[] = [];
  myToolbox.forEach((skill) => {
    if (skill.kind === 'soft') {
      softSkillsRows.push(
          <Tr key={skill.name}>
            <Td>{skill.name}</Td>
            <Td>{skill.trait}</Td>
            <Td>{skill.anecdote}</Td>
          </Tr>
      );
    } else {
      technicalSkillsRows.push(
          <Tr key={skill.name}>
            <Td>
              <Link
                href={skill.link}
                target='_blank'
                rel='noopener noreferrer'
              >{skill.name}</Link>
            </Td>
            <Td>{skill.tool}</Td>
            <Td>{skill.experience}</Td>
            <Td>{skill.why}</Td>
          </Tr>
      );
    }
  });
  return (
    <>
      {technicalSkillsRows && (
        <Table className={classNames.table}>
          <Thead>
            <Tr>
              <Th>name</Th>
              <Th>type</Th>
              <Th>experience</Th>
              <Th>why</Th>
            </Tr>
          </Thead>
          <Tbody>
            {technicalSkillsRows}
          </Tbody>
        </Table>)}
      {softSkillsRows && (
        <Table className={classNames.table}>
          <Thead>
            <Tr>
              <Th>name</Th>
              <Th>trait</Th>
              <Th>anecdote</Th>
            </Tr>
          </Thead>
          <Tbody>
            {softSkillsRows}
          </Tbody>
        </Table>)}
    </>
  );
};
